package com.charity.controller;

import com.charity.dto.ApiResponse;
import com.charity.dto.auth.*;
import com.charity.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Auth endpoints — new flow:
 *
 *  POST /api/auth/register          → create account, send OTP
 *  POST /api/auth/verify-account    → one-time OTP verification, returns JWT
 *  POST /api/auth/resend-otp        → resend verification OTP (cooldown enforced)
 *  POST /api/auth/login             → email+password → JWT (no OTP if verified)
 *  POST /api/auth/logout            → clears cookies, records logout time
 *  POST /api/auth/refresh-token     → rotates access + refresh tokens
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, Verify, Login, Logout")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register — creates account and sends verification OTP to email")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest req,
            HttpServletRequest request) {
        AuthResponse res = authService.register(req, request.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok(res.getMessage(), res));
    }

    @PostMapping("/verify-account")
    @Operation(summary = "One-time account verification via email OTP")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyAccount(
            @Valid @RequestBody OtpRequest req,
            HttpServletRequest request,
            HttpServletResponse response) {
        AuthResponse res = authService.verifyAccount(
                req, response,
                request.getRemoteAddr(),
                request.getHeader("User-Agent"));
        return ResponseEntity.ok(ApiResponse.ok(res.getMessage(), res));
    }

    @PostMapping("/resend-otp")
    @Operation(summary = "Resend verification OTP (30-second cooldown)")
    public ResponseEntity<ApiResponse<AuthResponse>> resendOtp(
            @RequestParam String email,   // accepts email OR mobile number
            HttpServletRequest request) {
        AuthResponse res = authService.resendVerificationOtp(email, request.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok(res.getMessage(), res));
    }

    @PostMapping("/login")
    @Operation(summary = "Login — email + password, JWT returned directly if account is verified")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest req,
            HttpServletRequest request,
            HttpServletResponse response) {
        AuthResponse res = authService.login(
                req, response,
                request.getRemoteAddr(),
                request.getHeader("User-Agent"));
        return ResponseEntity.ok(ApiResponse.ok(res.getMessage(), res));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout — clears cookies and records logout time")
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletRequest request,
            HttpServletResponse response) {
        authService.logout(request, response, request.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully", null));
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Rotate access + refresh tokens")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            HttpServletRequest request,
            HttpServletResponse response) {
        AuthResponse res = authService.refreshToken(request, response, request.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed", res));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Send password reset OTP to registered email")
    public ResponseEntity<ApiResponse<AuthResponse>> forgotPassword(
            @RequestBody java.util.Map<String, String> body,
            HttpServletRequest request) {
        String email = body.get("email");
        if (email == null || email.isBlank())
            throw new RuntimeException("Email is required");
        AuthResponse res = authService.forgotPassword(email.trim(), request.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok(res.getMessage(), res));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using OTP")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @RequestBody java.util.Map<String, String> body) {
        String email    = body.get("email");
        String otp      = body.get("otp");
        String newPwd   = body.get("newPassword");
        if (email == null || otp == null || newPwd == null)
            throw new RuntimeException("Email, OTP and new password are required");
        authService.resetPassword(email.trim(), otp.trim(), newPwd);
        return ResponseEntity.ok(ApiResponse.ok("Password reset successfully. You can now log in.", null));
    }
}
