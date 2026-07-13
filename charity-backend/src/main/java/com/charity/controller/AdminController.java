package com.charity.controller;

import com.charity.dto.ApiResponse;
import com.charity.entity.*;
import com.charity.repository.*;
import com.charity.service.UserActivityService;
import com.charity.service.AuditLogService;
import com.charity.service.LoginHistoryService;
import com.charity.entity.UserActivity;
import com.charity.entity.UserActivity.ActivityType;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin-only operations")
public class AdminController {

    private final UserRepository         userRepository;
    private final AuditLogService        auditLogService;
    private final LoginHistoryService    loginHistoryService;
    private final LoginHistoryRepository loginHistoryRepository;
    private final UserActivityService    userActivityService;
    private final FundAllocationRepository fundAllocationRepository;
    private final EventRepository        eventRepository;
    private final DonationRepository     donationRepository;
    private final CampaignRepository     campaignRepository;

    // ══════════════════════════════════════════════════════════
    //  DASHBOARD STATS
    // ══════════════════════════════════════════════════════════

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> stats() {
        long totalUsers      = userRepository.count();
        long totalDonations  = donationRepository.count();
        long activeCampaigns = campaignRepository.countByStatus(Campaign.CampaignStatus.ACTIVE);
        BigDecimal totalAmt  = donationRepository
                .findByStatus(Donation.DonationStatus.SUCCESS)
                .stream()
                .map(Donation::getAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        // Login stats
        long recentLogins = 0;
        try {
            recentLogins = loginHistoryRepository.countByLoginTimeAfter(
                    java.time.LocalDateTime.now().minusHours(24));
        } catch (Exception ignored) {}

        // User role counts
        long totalDonors = 0;
        long lockedUsers = 0;
        try {
            totalDonors = userRepository.countByRoleRoleName(Role.RoleName.USER);
            lockedUsers = userRepository.countByLocked(true);
        } catch (Exception ignored) {}

        Map<String, Object> s = new LinkedHashMap<>();
        s.put("totalUsers",          totalUsers);
        s.put("totalDonors",         totalDonors);
        s.put("totalDonations",      totalDonations);
        s.put("activeCampaigns",     activeCampaigns);
        s.put("totalAmount",         totalAmt != null ? totalAmt : BigDecimal.ZERO);
        s.put("pendingAllocations",  0);
        s.put("recentLogins",        recentLogins);
        s.put("lockedUsers",         lockedUsers);
        return ResponseEntity.ok(ApiResponse.ok(s));
    }

    @GetMapping("/donations/monthly")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> monthlyDonations() {
        List<Donation> all = donationRepository.findByStatus(Donation.DonationStatus.SUCCESS);
        Map<Month, BigDecimal> byMonth = new LinkedHashMap<>();
        Month[] months = Month.values();
        for (Month m : months) byMonth.put(m, BigDecimal.ZERO);

        for (Donation d : all) {
            Month m = d.getDonationDate().getMonth();
            byMonth.merge(m, d.getAmount(), BigDecimal::add);
        }

        String[] abbr = {"Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"};
        List<Map<String, Object>> result = new ArrayList<>();
        for (Month m : months) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("month",  abbr[m.ordinal()]);
            row.put("amount", byMonth.get(m));
            result.add(row);
        }
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ══════════════════════════════════════════════════════════
    //  USER MANAGEMENT
    // ══════════════════════════════════════════════════════════

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<User>>> allUsers() {
        return ResponseEntity.ok(ApiResponse.ok(userRepository.findAll()));
    }

    @PutMapping("/users/{id}/toggle-lock")
    public ResponseEntity<ApiResponse<String>> toggleLock(@PathVariable String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setLocked(!user.getLocked());
        // Reset failed attempts so unlocked users can actually log in
        if (!user.getLocked()) {
            user.setFailedLoginAttempts(0);
            user.setLastFailedLogin(null);
        }
        userRepository.save(user);
        String msg = user.getLocked() ? "User locked" : "User unlocked and login attempts reset";
        return ResponseEntity.ok(ApiResponse.ok(msg, null));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole().getRoleName() == Role.RoleName.ADMIN) {
            throw new RuntimeException("Cannot delete admin accounts");
        }
        userRepository.delete(user);
        return ResponseEntity.ok(ApiResponse.ok("User deleted successfully", null));
    }

    @PutMapping("/users/{id}/toggle-enable")
    public ResponseEntity<ApiResponse<String>> toggleEnable(@PathVariable String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(!user.getEnabled());
        userRepository.save(user);
        String msg = user.getEnabled() ? "User account enabled" : "User account disabled";
        return ResponseEntity.ok(ApiResponse.ok(msg, null));
    }

    // ══════════════════════════════════════════════════════════
    //  USER ACTIVITIES (new comprehensive tracking)
    // ══════════════════════════════════════════════════════════

    @GetMapping("/activities")
    public ResponseEntity<ApiResponse<Page<UserActivity>>> activities(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "25") int size) {

        ActivityType actType = null;
        if (type != null && !type.isBlank()) {
            try { actType = ActivityType.valueOf(type.toUpperCase()); } catch (Exception ignored) {}
        }
        java.time.LocalDateTime fromDt = from != null ? java.time.LocalDateTime.parse(from) : null;
        java.time.LocalDateTime toDt   = to   != null ? java.time.LocalDateTime.parse(to)   : null;

        Page<UserActivity> result = userActivityService.filter(
                userId, actType, fromDt, toDt, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/activities/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> activityStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalLogins",        userActivityService.countByType(ActivityType.LOGGED_IN));
        stats.put("totalRegistrations", userActivityService.countByType(ActivityType.REGISTERED));
        stats.put("totalDonations",     userActivityService.countByType(ActivityType.DONATION_COMPLETED));
        stats.put("activeUsersToday",   userActivityService.countActiveUsersToday());
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @GetMapping("/activities/types")
    public ResponseEntity<ApiResponse<ActivityType[]>> activityTypes() {
        return ResponseEntity.ok(ApiResponse.ok(ActivityType.values()));
    }

    // ══════════════════════════════════════════════════════════
    //  RECENT ACTIVITIES FOR ADMIN DASHBOARD
    // ══════════════════════════════════════════════════════════

    @GetMapping("/recent-activities")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> recentActivities(
            @RequestParam(defaultValue = "10") int limit) {
        List<Map<String, Object>> result = new ArrayList<>();

        // Recent logins
        loginHistoryRepository.findTop10ByOrderByLoginTimeDesc().stream()
            .limit(limit / 2)
            .forEach(l -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("type",      "LOGIN");
                row.put("icon",      l.getStatus() == LoginHistory.LoginStatus.SUCCESS ? "🔑" : "❌");
                row.put("user",      l.getUser() != null ? l.getUser().getFullName() : "Unknown");
                row.put("email",     l.getUser() != null ? l.getUser().getEmail() : "");
                row.put("action",    l.getStatus() == LoginHistory.LoginStatus.SUCCESS ? "Logged In" : "Login Failed");
                row.put("ip",        l.getIpAddress());
                row.put("timestamp", l.getLoginTime());
                result.add(row);
            });

        // Recent audit logs
        auditLogService.getAllLogs(PageRequest.of(0, limit / 2)).getContent()
            .forEach(a -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("type",      a.getAction());
                row.put("icon",      getActionIcon(a.getAction()));
                row.put("user",      a.getUser() != null ? a.getUser().getFullName() : "System");
                row.put("email",     a.getUser() != null ? a.getUser().getEmail() : "");
                row.put("action",    a.getAction().replace("_", " "));
                row.put("ip",        a.getIpAddress());
                row.put("timestamp", a.getTimestamp());
                row.put("details",   a.getDetails());
                result.add(row);
            });

        // Sort by timestamp desc
        result.sort((a, b) -> {
            java.time.LocalDateTime ta = (java.time.LocalDateTime) a.get("timestamp");
            java.time.LocalDateTime tb = (java.time.LocalDateTime) b.get("timestamp");
            if (ta == null || tb == null) return 0;
            return tb.compareTo(ta);
        });

        return ResponseEntity.ok(ApiResponse.ok(result.stream().limit(limit).toList()));
    }

    private String getActionIcon(String action) {
        if (action == null) return "•";
        return switch (action) {
            case "LOGIN_SUCCESS"    -> "🔑";
            case "LOGIN_FAILED"     -> "❌";
            case "USER_REGISTERED"  -> "✅";
            case "ACCOUNT_VERIFIED" -> "✔️";
            case "ACCOUNT_LOCKED"   -> "🔒";
            case "DONATION_INITIATED", "DONATION_SUCCESS" -> "💰";
            case "CAMPAIGN_CREATED" -> "🎯";
            case "PASSWORD_CHANGED", "PASSWORD_RESET_REQUESTED" -> "🔐";
            case "LOGOUT"           -> "🚪";
            default -> "📋";
        };
    }

    // ══════════════════════════════════════════════════════════
    //  USER ACTIVITY / LOGIN HISTORY
    // ══════════════════════════════════════════════════════════

    @GetMapping("/users/{id}/activity")
    public ResponseEntity<ApiResponse<List<LoginHistory>>> userActivity(@PathVariable String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(ApiResponse.ok(loginHistoryService.getUserHistory(user)));
    }

    @GetMapping("/login-history")
    public ResponseEntity<ApiResponse<Page<LoginHistory>>> loginHistory(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                loginHistoryService.getAllHistory(PageRequest.of(page, size, Sort.by("loginTime").descending()))));
    }

    // ══════════════════════════════════════════════════════════
    //  AUDIT LOGS
    // ══════════════════════════════════════════════════════════

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> auditLogs(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                auditLogService.getAllLogs(PageRequest.of(page, size))));
    }

    @GetMapping("/audit-logs/user/{userId}")
    public ResponseEntity<ApiResponse<Page<AuditLog>>> userAuditLogs(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                auditLogService.getUserLogs(userId, PageRequest.of(page, size))));
    }

    // ══════════════════════════════════════════════════════════
    //  FUND ALLOCATIONS
    // ══════════════════════════════════════════════════════════

    @PostMapping("/fund-allocations")
    public ResponseEntity<ApiResponse<Map<String, Object>>> allocateFunds(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {
        String campaignId   = body.get("campaignId").toString();
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String purpose    = body.get("purpose").toString();
        String desc       = body.containsKey("description") ? body.get("description").toString() : null;

        Campaign campaign = campaignRepository.findById(campaignId).orElseThrow();
        User admin        = userRepository.findByEmail(ud.getUsername()).orElseThrow();

        FundAllocation fa = FundAllocation.builder()
                .campaign(campaign).allocatedBy(admin)
                .amount(amount).purpose(purpose).description(desc)
                .build();
        fundAllocationRepository.save(fa);

        // Return safe DTO instead of raw entity (avoids lazy proxy errors)
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("allocationId", fa.getAllocationId());
        result.put("campaignId",   campaign.getCampaignId());
        result.put("campaignName", campaign.getCampaignName());
        result.put("purpose",      fa.getPurpose());
        result.put("description",  fa.getDescription());
        result.put("amount",       fa.getAmount());
        result.put("allocatedAt",  fa.getAllocatedAt());
        result.put("allocatedBy",  admin.getFullName());
        return ResponseEntity.ok(ApiResponse.ok("Funds allocated successfully", result));
    }

    @GetMapping("/fund-allocations/{campaignId}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFundAllocations(
            @PathVariable String campaignId) {
        List<FundAllocation> allocations = fundAllocationRepository.findByCampaignCampaignId(campaignId);
        List<Map<String, Object>> result = allocations.stream().map(a -> {
            Map<String, Object> row = new java.util.LinkedHashMap<>();
            row.put("allocationId", a.getAllocationId());
            row.put("purpose",      a.getPurpose());
            row.put("description",  a.getDescription());
            row.put("amount",       a.getAmount());
            row.put("allocatedAt",  a.getAllocatedAt());
            row.put("allocatedBy",  a.getAllocatedBy() != null ? a.getAllocatedBy().getFullName() : "Admin");
            return row;
        }).toList();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ══════════════════════════════════════════════════════════
    //  EVENTS
    // ══════════════════════════════════════════════════════════

    @PostMapping("/events")
    public ResponseEntity<ApiResponse<Event>> createEvent(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {
        User admin = userRepository.findByEmail(ud.getUsername()).orElseThrow();
        Event event = Event.builder()
                .eventName(body.get("eventName").toString())
                .location(body.get("location").toString())
                .eventDate(LocalDateTime.parse(body.get("eventDate").toString()))
                .description(body.containsKey("description") ? body.get("description").toString() : null)
                .createdBy(admin)
                .status(Event.EventStatus.UPCOMING)
                .build();
        eventRepository.save(event);
        return ResponseEntity.ok(ApiResponse.ok("Event created", event));
    }

    @GetMapping("/events")
    public ResponseEntity<ApiResponse<List<Event>>> allEvents() {
        return ResponseEntity.ok(ApiResponse.ok(eventRepository.findAll()));
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<ApiResponse<String>> deleteEvent(@PathVariable String id) {
        eventRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Event deleted", null));
    }
}
