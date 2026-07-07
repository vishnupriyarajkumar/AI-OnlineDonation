package com.charity.service;

import com.charity.dto.auth.*;
import com.charity.entity.*;
import com.charity.entity.UserActivity.ActivityType;
import com.charity.repository.*;
import com.charity.security.JwtUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Complete Authentication Service
 *
 * REGISTRATION FLOW:
 *   Email-based:  POST /register → OTP to email → /verify-account → JWT issued
 *   Mobile-based: POST /register → OTP via SMS  → /verify-account → JWT issued
 *
 * LOGIN FLOW (after verified):
 *   POST /login → email or phone + password → JWT directly (no OTP)
 *
 * SECURITY:
 *   - BCrypt passwords
 *   - Account locks after 5 failed attempts
 *   - All activities recorded via UserActivityService
 *   - Login history tracked permanently
 *   - Remember Me = 30-day refresh token
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private static final int MAX_FAILED = 5;

    private final UserRepository        userRepository;
    private final RoleRepository        roleRepository;
    private final JwtUtil               jwtUtil;
    private final PasswordEncoder       passwordEncoder;
    private final OtpService            otpService;
    private final EmailService          emailService;
    private final TwilioSmsService      twilioSmsService;
    private final RefreshTokenService   refreshTokenService;
    private final LoginHistoryService   loginHistoryService;
    private final UserActivityService   activityService;
    private final AuditLogService       auditLogService;
    private final SubscriptionService   subscriptionService;
    private final NotificationService   notificationService;

    // ═══════════════════════════════════════════════════════════
    //  REGISTER — supports both email and mobile
    // ═══════════════════════════════════════════════════════════

    public AuthResponse register(RegisterRequest req, String ipAddress) {
        // Validate passwords match
        if (!req.getPassword().equals(req.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        // Validate: at least email OR phone must be provided
        boolean hasEmail  = req.getEmail() != null && !req.getEmail().isBlank();
        boolean hasPhone  = req.getPhone() != null && !req.getPhone().isBlank();

        if (!hasEmail && !hasPhone) {
            throw new RuntimeException("Either email or mobile number is required");
        }

        // Validate email format if provided
        if (hasEmail && !req.getEmail().matches("^[\\w.+\\-]+@[\\w\\-]+\\.[\\w.]+$")) {
            throw new RuntimeException("Invalid email format");
        }

        // Validate phone format if provided
        if (hasPhone && !req.getPhone().matches("^[6-9]\\d{9}$")) {
            throw new RuntimeException("Mobile number must be a valid 10-digit Indian number");
        }

        // Check uniqueness
        if (hasEmail && userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email is already registered");
        }
        if (hasPhone && userRepository.existsByPhone(req.getPhone())) {
            throw new RuntimeException("Mobile number is already registered");
        }

        Role role = roleRepository.findByRoleName(Role.RoleName.USER)
                .orElseThrow(() -> new RuntimeException("Default role not found"));

        User user = User.builder()
                .fullName(req.getFullName())
                .email(hasEmail ? req.getEmail() : null)
                .password(passwordEncoder.encode(req.getPassword()))
                .phone(hasPhone ? req.getPhone() : null)
                .address(req.getAddress())
                .role(role)
                .isVerified(false)
                .enabled(true)
                .locked(false)
                .failedLoginAttempts(0)
                .preferredLanguage(req.getPreferredLanguage() != null ? req.getPreferredLanguage() : "en")
                .build();

        userRepository.save(user);

        // Create default GENERAL subscription for new user
        subscriptionService.createDefault(user);

        // Generate OTP and send via appropriate channel
        OtpVerification otp = otpService.generateAndSendToChannel(user, req.isEmailRegistration());

        // Record activity
        activityService.record(user, ActivityType.REGISTERED,
                "Account created via " + (req.isEmailRegistration() ? "email" : "mobile"),
                ipAddress, "{\"method\":\"" + req.getRegistrationMethod() + "\"}");
        auditLogService.log(user, "USER_REGISTERED", "User", user.getUserId(),
                ipAddress, "Account created. OTP sent via " +
                (req.isEmailRegistration() ? user.getEmail() : user.getPhone()));

        return AuthResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .needsVerification(true)
                .resendCooldownSeconds(otp.secondsUntilResendAllowed())
                .message("Account created! Check your " +
                        (req.isEmailRegistration() ? "email" : "mobile") +
                        " for the verification code.")
                .build();
    }

    // ═══════════════════════════════════════════════════════════
    //  VERIFY ACCOUNT — one-time OTP, works for both channels
    // ═══════════════════════════════════════════════════════════

    public AuthResponse verifyAccount(OtpRequest req, HttpServletResponse response,
                                      String ipAddress, String deviceInfo) {
        // Support lookup by email OR phone
        User user = findUserByEmailOrPhone(req.getEmail());

        if (Boolean.TRUE.equals(user.getIsVerified())) {
            throw new RuntimeException("Account already verified. Please log in.");
        }

        otpService.verify(user, req.getOtp());

        user.setIsVerified(true);
        userRepository.save(user);

        String accessToken   = jwtUtil.generateAccessToken(user);
        RefreshToken refresh = refreshTokenService.create(user, false);

        setAccessCookie(response, accessToken, 900);
        setRefreshCookie(response, refresh.getToken(), 7 * 24 * 3600);

        // Send welcome email only if user has an email address
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());
        }

        // Create welcome in-app notification + notify admin of new registration
        notificationService.welcomeNewUser(user);

        loginHistoryService.recordLogin(user, ipAddress, deviceInfo,
                LoginHistory.LoginStatus.SUCCESS);

        activityService.record(user,
                user.getEmail() != null ? ActivityType.EMAIL_VERIFIED : ActivityType.MOBILE_VERIFIED,
                "Account verified and activated", ipAddress);
        auditLogService.log(user, "ACCOUNT_VERIFIED", "User", user.getUserId(),
                ipAddress, "Account activated");

        return AuthResponse.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().getRoleName().name())
                .accessToken(accessToken)
                .refreshToken(refresh.getToken())
                .needsVerification(false)
                .message("Account verified! Welcome to CharityOrg.")
                .build();
    }

    // ═══════════════════════════════════════════════════════════
    //  RESEND VERIFICATION OTP
    // ═══════════════════════════════════════════════════════════

    public AuthResponse resendVerificationOtp(String identifier, String ipAddress) {
        User user = findUserByEmailOrPhone(identifier);

        if (Boolean.TRUE.equals(user.getIsVerified())) {
            throw new RuntimeException("Account is already verified.");
        }

        boolean useEmail = user.getEmail() != null && !user.getEmail().isBlank();
        OtpVerification otp = otpService.generateAndSendToChannel(user, useEmail);

        activityService.record(user, ActivityType.REGISTERED,
                "Verification OTP resent", ipAddress);

        return AuthResponse.builder()
                .email(user.getEmail())
                .needsVerification(true)
                .resendCooldownSeconds(otp.secondsUntilResendAllowed())
                .message("Verification code resent.")
                .build();
    }

    // ═══════════════════════════════════════════════════════════
    //  LOGIN — email or phone + password, NO OTP after verification
    // ═══════════════════════════════════════════════════════════

    public AuthResponse login(LoginRequest req, HttpServletResponse response,
                              String ipAddress, String deviceInfo) {
        // Support login by email or phone
        User user = findUserByEmailOrPhone(req.getEmail());

        if (Boolean.TRUE.equals(user.getLocked())) {
            loginHistoryService.recordLogin(user, ipAddress, deviceInfo, LoginHistory.LoginStatus.LOCKED);
            activityService.record(user, ActivityType.LOGIN_FAILED,
                    "Login attempt on locked account", ipAddress);
            throw new RuntimeException("Account locked. Please contact admin.");
        }

        if (!Boolean.TRUE.equals(user.getEnabled())) {
            throw new RuntimeException("Account disabled. Please contact admin.");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            handleFailedLogin(user, ipAddress, deviceInfo);
            if (Boolean.TRUE.equals(user.getLocked())) {
                throw new RuntimeException("Account locked after 5 failed attempts. Contact admin.");
            }
            int rem = MAX_FAILED - user.getFailedLoginAttempts();
            throw new RuntimeException("Invalid credentials. " + rem + " attempt(s) remaining.");
        }

        // Reset failure counter
        user.setFailedLoginAttempts(0);
        user.setLastFailedLogin(null);
        userRepository.save(user);

        // Unverified — resend OTP and redirect
        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            boolean useEmail = user.getEmail() != null && !user.getEmail().isBlank();
            OtpVerification otp = otpService.generateAndSendToChannel(user, useEmail);
            activityService.record(user, ActivityType.LOGIN_FAILED,
                    "Login on unverified account — OTP resent", ipAddress);

            return AuthResponse.builder()
                    .userId(user.getUserId()).email(user.getEmail()).fullName(user.getFullName())
                    .needsVerification(true)
                    .resendCooldownSeconds(otp.secondsUntilResendAllowed())
                    .message("Please verify your account first. A new code was sent.")
                    .build();
        }

        // Issue JWT
        String accessToken  = jwtUtil.generateAccessToken(user);
        RefreshToken refresh = refreshTokenService.create(user, req.isRememberMe());

        int refreshMaxAge = req.isRememberMe() ? 30 * 24 * 3600 : 7 * 24 * 3600;
        setAccessCookie(response, accessToken, 900);
        setRefreshCookie(response, refresh.getToken(), refreshMaxAge);

        loginHistoryService.recordLogin(user, ipAddress, deviceInfo, LoginHistory.LoginStatus.SUCCESS);
        activityService.record(user, ActivityType.LOGGED_IN,
                "Successful login. RememberMe=" + req.isRememberMe(), ipAddress,
                "{\"rememberMe\":" + req.isRememberMe() + "}");
        auditLogService.log(user, "LOGIN_SUCCESS", "User", user.getUserId(),
                ipAddress, "Login successful");

        // Notify admin of login
        notificationService.send(
            userRepository.findByEmail("newdawnfoundationtrust@gmail.com").orElse(null),
            com.charity.entity.Notification.NotificationType.ADMIN_NEW_USER,
            "User Login",
            user.getFullName() + " (" + (user.getEmail() != null ? user.getEmail() : user.getPhone())
                + ") logged in from IP: " + ipAddress,
            "/admin/audit-logs", false
        );
        notificationService.notifyAdminOfActivity(user, "User Login", ipAddress, deviceInfo);

        // Check if this is the user's first login (for onboarding)
        boolean firstLogin = subscriptionService.isFirstLogin(user);
        subscriptionService.markFirstLoginDone(user);

        return AuthResponse.builder()
                .userId(user.getUserId()).fullName(user.getFullName())
                .email(user.getEmail()).role(user.getRole().getRoleName().name())
                .accessToken(accessToken).refreshToken(refresh.getToken())
                .needsVerification(false).isFirstLogin(firstLogin)
                .message("Login successful")
                .build();
    }

    // ═══════════════════════════════════════════════════════════
    //  LOGOUT
    // ═══════════════════════════════════════════════════════════

    public void logout(HttpServletRequest request, HttpServletResponse response, String ipAddress) {
        String tokenStr = extractCookie(request, "refresh_token");
        if (tokenStr != null) {
            try {
                RefreshToken rt = refreshTokenService.validate(tokenStr);
                User user = rt.getUser();
                loginHistoryService.recordLogout(user);
                refreshTokenService.deleteByUser(user);
                activityService.record(user, ActivityType.LOGGED_OUT, "User logged out", ipAddress);
                auditLogService.log(user, "LOGOUT", "User", user.getUserId(), ipAddress, "Logout");
            } catch (Exception e) {
                log.debug("Logout cleanup: {}", e.getMessage());
            }
        }
        clearCookie(response, "access_token");
        clearCookie(response, "refresh_token");
    }

    // ═══════════════════════════════════════════════════════════
    //  REFRESH TOKEN
    // ═══════════════════════════════════════════════════════════

    public AuthResponse refreshToken(HttpServletRequest request,
                                     HttpServletResponse response, String ipAddress) {
        String tokenStr = extractCookie(request, "refresh_token");
        if (tokenStr == null) throw new RuntimeException("Refresh token missing");

        RefreshToken rt = refreshTokenService.validate(tokenStr);
        User user       = rt.getUser();

        if (Boolean.TRUE.equals(user.getLocked()))   throw new RuntimeException("Account is locked.");
        if (!Boolean.TRUE.equals(user.getEnabled())) throw new RuntimeException("Account is disabled.");

        String newAccess = jwtUtil.generateAccessToken(user);
        setAccessCookie(response, newAccess, 900);

        RefreshToken newRt = refreshTokenService.create(user, rt.isRememberMe());
        setRefreshCookie(response, newRt.getToken(), rt.isRememberMe() ? 30*24*3600 : 7*24*3600);

        return AuthResponse.builder()
                .userId(user.getUserId()).fullName(user.getFullName())
                .email(user.getEmail()).role(user.getRole().getRoleName().name())
                .accessToken(newAccess).message("Token refreshed")
                .build();
    }

    // ═══════════════════════════════════════════════════════════
    //  FORGOT PASSWORD — sends OTP to registered email
    // ═══════════════════════════════════════════════════════════

    public AuthResponse forgotPassword(String email, String ipAddress) {
        // Try to find by email or phone
        User user = userRepository.findByEmail(email)
                .or(() -> userRepository.findByPhone(email))
                .orElse(null);

        if (user == null || !Boolean.TRUE.equals(user.getEnabled())) {
            // Return same message to prevent email enumeration
            return AuthResponse.builder()
                    .email(email)
                    .needsVerification(true)
                    .message("If an account with that email exists, a password reset code has been sent.")
                    .build();
        }

        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            throw new RuntimeException(
                "Account not verified. Please verify your account first before resetting password.");
        }

        try {
            otpService.generateAndSendForPasswordReset(user);
            log.info("Password reset OTP sent to user: {}", user.getEmail());
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("Please wait")) {
                throw e;
            }
            log.warn("Could not send password reset OTP: {}", e.getMessage());
            throw new RuntimeException("Could not send reset code: " + e.getMessage());
        }

        auditLogService.log(user, "PASSWORD_RESET_REQUESTED", "User",
                user.getUserId(), ipAddress, "Password reset OTP sent to " + email);

        return AuthResponse.builder()
                .email(email)
                .needsVerification(true)
                .message("Password reset code sent to your registered email.")
                .build();
    }

    // ═══════════════════════════════════════════════════════════
    //  RESET PASSWORD — verify OTP then update password
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email)
                .or(() -> userRepository.findByPhone(email))
                .orElseThrow(() -> new RuntimeException("No account found for this email/phone."));

        // Validate new password strength
        if (!newPassword.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$")) {
            throw new RuntimeException(
                "Password must be 8+ chars with uppercase, lowercase, digit and special character");
        }

        // Verify the OTP
        otpService.verify(user, otp);

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setFailedLoginAttempts(0);
        user.setLocked(false);
        userRepository.save(user);

        activityService.record(user, com.charity.entity.UserActivity.ActivityType.PASSWORD_CHANGED,
                "Password reset via email OTP", null);
        auditLogService.log(user, "PASSWORD_CHANGED", "User", user.getUserId(),
                null, "Password reset successfully");
        notificationService.notifyAdminOfActivity(user, "Password Reset via OTP", null, null);

        // Send confirmation email
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            emailService.sendNotificationEmail(user.getEmail(), user.getFullName(),
                    "🔐 Password Changed",
                    "Your password has been successfully reset. If you did not make this change, please contact support immediately.",
                    "/login");
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════

    private User findUserByEmailOrPhone(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            throw new RuntimeException("Email or mobile number is required");
        }
        // Looks like a phone number (digits only, 10-15 chars)
        if (identifier.matches("^\\+?[6-9]\\d{9,14}$") || identifier.matches("^[6-9]\\d{9}$")) {
            return userRepository.findByPhone(identifier)
                    .or(() -> userRepository.findByEmail(identifier))
                    .orElseThrow(() -> new RuntimeException("Invalid email or mobile number"));
        }
        // Looks like email
        return userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByPhone(identifier))
                .orElseThrow(() -> new RuntimeException(
                    "No account found with this email or mobile number. Please register first."));
    }

    private void handleFailedLogin(User user, String ipAddress, String deviceInfo) {
        user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
        user.setLastFailedLogin(java.time.LocalDateTime.now());

        if (user.getFailedLoginAttempts() >= MAX_FAILED) {
            user.setLocked(true);
            activityService.record(user, ActivityType.ACCOUNT_LOCKED,
                    "Account locked after 5 failed attempts", ipAddress);
            auditLogService.log(user, "ACCOUNT_LOCKED", "User", user.getUserId(),
                    ipAddress, "Locked after 5 failed attempts");
        } else {
            activityService.record(user, ActivityType.LOGIN_FAILED,
                    "Failed login attempt #" + user.getFailedLoginAttempts(), ipAddress);
            auditLogService.log(user, "LOGIN_FAILED", "User", user.getUserId(),
                    ipAddress, "Attempt #" + user.getFailedLoginAttempts());
        }

        loginHistoryService.recordLogin(user, ipAddress, deviceInfo, LoginHistory.LoginStatus.FAILED);
        userRepository.save(user);
    }

    @Transactional
    public void changePassword(User user, String oldPassword, String newPassword, String ipAddress) {
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Current password does not match");
        }
        // Validate new password strength
        if (!newPassword.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$")) {
            throw new RuntimeException(
                "Password must be 8+ chars with uppercase, lowercase, digit and special character");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        activityService.record(user, ActivityType.PASSWORD_CHANGED, "Password updated from profile settings", ipAddress);
        auditLogService.log(user, "PASSWORD_CHANGED", "User", user.getUserId(), ipAddress, "Password changed via profile");

        // Send confirmation email to user
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            emailService.sendNotificationEmail(user.getEmail(), user.getFullName(),
                    "🔐 Password Changed",
                    "Your password has been successfully updated. If you did not make this change, please contact support immediately.",
                    "/login");
        }

        // Notify Admin
        notificationService.notifyAdminOfActivity(user, "Password Changed", ipAddress, null);
    }

    private void setAccessCookie(HttpServletResponse r, String v, int maxAge) {
        Cookie c = new Cookie("access_token", v);
        c.setHttpOnly(true); c.setSecure(false); c.setPath("/"); c.setMaxAge(maxAge);
        r.addCookie(c);
    }

    private void setRefreshCookie(HttpServletResponse r, String v, int maxAge) {
        Cookie c = new Cookie("refresh_token", v);
        c.setHttpOnly(true); c.setSecure(false); c.setPath("/"); c.setMaxAge(maxAge);
        r.addCookie(c);
    }

    private void clearCookie(HttpServletResponse r, String name) {
        Cookie c = new Cookie(name, ""); c.setMaxAge(0); c.setPath("/"); r.addCookie(c);
    }

    private String extractCookie(HttpServletRequest req, String name) {
        if (req.getCookies() == null) return null;
        for (Cookie c : req.getCookies()) if (name.equals(c.getName())) return c.getValue();
        return null;
    }
}
