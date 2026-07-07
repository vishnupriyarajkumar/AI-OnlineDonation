package com.charity.controller;

import com.charity.dto.ApiResponse;
import com.charity.entity.Notification.NotificationType;
import com.charity.entity.User;
import com.charity.repository.UserRepository;
import com.charity.service.LoginHistoryService;
import com.charity.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER','ADMIN')")
@Tag(name = "User Profile", description = "User profile management")
public class UserController {

    private final UserRepository      userRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder     passwordEncoder;
    private final LoginHistoryService loginHistoryService;

    // ── GET profile ───────────────────────────────────────────

    @GetMapping("/profile")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(
            @AuthenticationPrincipal UserDetails ud) {
        User user = resolve(ud);
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("userId",    user.getUserId());
        profile.put("fullName",  user.getFullName());
        profile.put("email",     user.getEmail());
        profile.put("phone",     user.getPhone());
        profile.put("address",   user.getAddress());
        profile.put("role",      user.getRole().getRoleName().name());
        profile.put("isVerified",user.getIsVerified());
        profile.put("createdAt", user.getCreatedAt());
        profile.put("preferredLanguage", user.getPreferredLanguage());
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    // ── UPDATE profile ────────────────────────────────────────

    @PutMapping("/profile")
    @Transactional
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {
        User user = resolve(ud);

        if (body.containsKey("fullName") && body.get("fullName") != null) {
            String name = body.get("fullName").toString().trim();
            if (!name.isBlank()) user.setFullName(name);
        }

        if (body.containsKey("phone")) {
            String phone = body.get("phone") != null ? body.get("phone").toString().trim() : null;
            if (phone != null && !phone.isBlank()) {
                // Only check uniqueness if different from current
                String currentPhone = user.getPhone();
                if (!phone.equals(currentPhone)) {
                    userRepository.findByPhone(phone).ifPresent(other -> {
                        if (!other.getUserId().equals(user.getUserId())) {
                            throw new RuntimeException(
                                "This mobile number is already registered to another account.");
                        }
                    });
                }
                user.setPhone(phone);
            } else {
                user.setPhone(null);
            }
        }

        if (body.containsKey("address")) {
            String addr = body.get("address") != null ? body.get("address").toString().trim() : null;
            user.setAddress(addr == null || addr.isBlank() ? null : addr);
        }

        userRepository.save(user);

        // Notify admin of profile change
        notificationService.send(
            userRepository.findByEmail("newdawnfoundationtrust@gmail.com").orElse(null),
            NotificationType.ADMIN_NEW_USER,
            "Profile Updated",
            user.getFullName() + " updated their contact information.",
            "/admin/users", false);

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("userId",   user.getUserId());
        profile.put("fullName", user.getFullName());
        profile.put("email",    user.getEmail());
        profile.put("phone",    user.getPhone());
        profile.put("address",  user.getAddress());
        profile.put("role",     user.getRole().getRoleName().name());
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", profile));
    }

    // ── CHANGE PASSWORD ───────────────────────────────────────

    @PostMapping("/change-password")
    @Transactional
    @Operation(summary = "Change password (requires current password)")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails ud) {
        User user         = resolve(ud);
        String currentPwd = body.get("currentPassword") != null ? body.get("currentPassword").toString() : "";
        String newPwd     = body.get("newPassword")     != null ? body.get("newPassword").toString()     : "";

        if (!passwordEncoder.matches(currentPwd, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        if (!newPwd.matches(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$")) {
            throw new RuntimeException(
                "Password must be 8+ chars with uppercase, lowercase, digit & special char");
        }

        user.setPassword(passwordEncoder.encode(newPwd));
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully", null));
    }

    // ── LOGIN HISTORY ─────────────────────────────────────────

    @GetMapping("/login-history")
    @Operation(summary = "Get user login history")
    public ResponseEntity<ApiResponse<Object>> loginHistory(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails ud) {
        User user = resolve(ud);
        return ResponseEntity.ok(ApiResponse.ok(
            loginHistoryService.getUserHistory(user)));
    }

    // ── HELPER ────────────────────────────────────────────────

    private User resolve(UserDetails ud) {
        String identifier = ud.getUsername();
        return userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByPhone(identifier))
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
