package com.charity.controller;

import com.charity.dto.ApiResponse;
import com.charity.entity.Subscription;
import com.charity.entity.Subscription.DonorType;
import com.charity.entity.User;
import com.charity.repository.UserRepository;
import com.charity.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/user/subscription")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER','ADMIN')")
@Tag(name = "Subscription", description = "Monthly Giving subscription management")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final UserRepository      userRepository;

    @GetMapping
    @Operation(summary = "Get current user's subscription")
    public ResponseEntity<ApiResponse<Map<String, Object>>> get(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(
                subscriptionService.getSubscriptionSummary(resolve(ud))));
    }

    @PostMapping("/choose-plan")
    @Operation(summary = "Choose plan during onboarding (GENERAL or MONTHLY)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> choosePlan(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {
        User user   = resolve(ud);
        DonorType t = DonorType.valueOf(body.get("donorType").toString().toUpperCase());

        BigDecimal amount = null;
        int        day    = 1;
        String     campId = null;

        if (t == DonorType.MONTHLY) {
            amount = new BigDecimal(body.get("monthlyAmount").toString());
            day    = Integer.parseInt(body.get("donationDay").toString());
            if (body.containsKey("campaignId") && body.get("campaignId") != null)
                campId = body.get("campaignId").toString();
        }

        subscriptionService.choosePlan(user, t, amount, day, campId);
        return ResponseEntity.ok(ApiResponse.ok("Plan selected successfully",
                subscriptionService.getSubscriptionSummary(user)));
    }

    @PostMapping("/upgrade")
    @Operation(summary = "Upgrade GENERAL donor to Monthly Giving")
    public ResponseEntity<ApiResponse<Map<String, Object>>> upgrade(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {
        User user   = resolve(ud);
        BigDecimal amount = new BigDecimal(body.get("monthlyAmount").toString());
        int        day    = Integer.parseInt(body.get("donationDay").toString());
        String     campId = body.containsKey("campaignId") && body.get("campaignId") != null
                          ? body.get("campaignId").toString() : null;

        subscriptionService.upgrade(user, amount, day, campId);
        return ResponseEntity.ok(ApiResponse.ok("Upgraded to Monthly Giving!",
                subscriptionService.getSubscriptionSummary(user)));
    }

    @PutMapping("/modify-amount")
    @Operation(summary = "Modify monthly donation amount")
    public ResponseEntity<ApiResponse<Map<String, Object>>> modifyAmount(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {
        User user = resolve(ud);
        BigDecimal amount = new BigDecimal(body.get("monthlyAmount").toString());
        subscriptionService.modifyAmount(user, amount);
        return ResponseEntity.ok(ApiResponse.ok("Amount updated",
                subscriptionService.getSubscriptionSummary(user)));
    }

    @PutMapping("/change-date")
    @Operation(summary = "Change monthly donation day")
    public ResponseEntity<ApiResponse<Map<String, Object>>> changeDate(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {
        User user = resolve(ud);
        int day   = Integer.parseInt(body.get("donationDay").toString());
        subscriptionService.changeDonationDay(user, day);
        return ResponseEntity.ok(ApiResponse.ok("Donation date updated",
                subscriptionService.getSubscriptionSummary(user)));
    }

    @PostMapping("/pause")
    @Operation(summary = "Pause subscription")
    public ResponseEntity<ApiResponse<Map<String, Object>>> pause(
            @AuthenticationPrincipal UserDetails ud) {
        User user = resolve(ud);
        subscriptionService.pause(user);
        return ResponseEntity.ok(ApiResponse.ok("Subscription paused",
                subscriptionService.getSubscriptionSummary(user)));
    }

    @PostMapping("/resume")
    @Operation(summary = "Resume subscription")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resume(
            @AuthenticationPrincipal UserDetails ud) {
        User user = resolve(ud);
        subscriptionService.resume(user);
        return ResponseEntity.ok(ApiResponse.ok("Subscription resumed",
                subscriptionService.getSubscriptionSummary(user)));
    }

    @PostMapping("/cancel")
    @Operation(summary = "Cancel subscription")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancel(
            @AuthenticationPrincipal UserDetails ud) {
        User user = resolve(ud);
        subscriptionService.cancel(user);
        return ResponseEntity.ok(ApiResponse.ok("Subscription cancelled",
                subscriptionService.getSubscriptionSummary(user)));
    }

    // ── Admin ─────────────────────────────────────────────────

    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> adminStats() {
        return ResponseEntity.ok(ApiResponse.ok(subscriptionService.getAdminStats()));
    }

    // ── Helper ────────────────────────────────────────────────

    private User resolve(UserDetails ud) {
        return userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
