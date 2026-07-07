package com.charity.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class LoginRequest {

    /**
     * Accepts email address OR mobile number.
     * AuthService resolves the user by whichever matches.
     */
    @NotBlank(message = "Email or mobile number is required")
    private String email;   // field name kept as 'email' for JSON compat; accepts phone too

    @NotBlank(message = "Password is required")
    private String password;

    /** If true, refresh token lasts 30 days instead of 7 */
    private boolean rememberMe = false;
}
