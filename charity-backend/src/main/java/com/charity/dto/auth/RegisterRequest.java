package com.charity.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Registration DTO — supports two modes:
 *   EMAIL  → email required, phone optional
 *   MOBILE → phone required, email optional
 *
 * Cross-field validation (at least one of email/phone) is done in AuthService.
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 150)
    private String fullName;

    /** Optional for mobile-only registration. If provided, must be valid email. */
    private String email;

    /** Optional for email-only registration. If provided, must be 10-digit Indian number. */
    private String phone;

    @NotBlank(message = "Password is required")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
        message = "Password must be 8+ chars with uppercase, lowercase, digit and special character (@$!%*?&)"
    )
    private String password;

    @NotBlank(message = "Confirm password is required")
    private String confirmPassword;

    private String address;

    /** "EMAIL" or "MOBILE" — drives which OTP channel is used */
    private String registrationMethod = "EMAIL";

    private String preferredLanguage = "en";

    private String role = "USER"; // Default to USER role

    public boolean isEmailRegistration() {
        return "MOBILE".equalsIgnoreCase(registrationMethod) == false
            && (email != null && !email.isBlank());
    }

    public boolean isMobileRegistration() {
        return "MOBILE".equalsIgnoreCase(registrationMethod)
            || (phone != null && !phone.isBlank() && (email == null || email.isBlank()));
    }
}
