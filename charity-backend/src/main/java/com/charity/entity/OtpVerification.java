package com.charity.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "otp_verifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OtpVerification {

    @Id
    private String id;

    @DBRef
    @Indexed(unique = true)
    private User user;

    private String otpHash;
    private LocalDateTime expiryTime;

    @Builder.Default
    private int attempts = 0;

    @Builder.Default
    private boolean verified = false;

    private LocalDateTime lastSentAt;

    @CreatedDate
    private LocalDateTime createdAt;

    public boolean isExpired()         { return LocalDateTime.now().isAfter(expiryTime); }
    public boolean isResendBlocked()   { return lastSentAt != null && LocalDateTime.now().isBefore(lastSentAt.plusSeconds(30)); }
    public long secondsUntilResendAllowed() {
        if (lastSentAt == null) return 0;
        long diff = java.time.Duration.between(LocalDateTime.now(), lastSentAt.plusSeconds(30)).getSeconds();
        return Math.max(0, diff);
    }
}
