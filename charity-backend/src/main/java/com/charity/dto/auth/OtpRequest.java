package com.charity.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * OTP verification request.
 * 'identifier' can be an email address OR a mobile number —
 * the backend resolves the user by either field.
 */
@Data
public class OtpRequest {

    /** Email address or mobile number of the account being verified */
    @NotBlank(message = "Email or mobile number is required")
    private String email;   // kept as 'email' for JSON compatibility; accepts phone too

    @NotBlank(message = "OTP is required")
    @Size(min = 6, max = 6, message = "OTP must be exactly 6 digits")
    private String otp;
}
