package com.charity.dto.auth;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

/**
 * Unified auth response.
 *
 * On successful login (verified user):
 *   accessToken set, otpRequired = false, needsVerification = false
 *
 * On registration / unverified login attempt:
 *   accessToken null, needsVerification = true
 *
 * On OTP verified (account activation):
 *   accessToken set, needsVerification = false
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {
    private String  userId;
    private String  fullName;
    private String  email;
    private String  role;
    private String  accessToken;
    private String  refreshToken;
    private String  message;

    @Builder.Default
    private boolean needsVerification = false;

    @Builder.Default
    private boolean isFirstLogin = false;

    /** Seconds before resend is allowed */
    private Long    resendCooldownSeconds;
}
