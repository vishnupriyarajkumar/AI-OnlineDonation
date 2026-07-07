package com.charity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Stores one active OTP record per user.
 * Replaced on every new OTP request.
 */
@Entity
@Table(name = "otp_verification")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The user this OTP belongs to. One record per user — upserted on each send. */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** BCrypt-hashed 6-digit code stored for secure comparison. */
    @Column(nullable = false, length = 100)
    private String otpHash;

    /** When this OTP expires (5 minutes from creation). */
    @Column(nullable = false)
    private LocalDateTime expiryTime;

    /** Number of incorrect verification attempts (max 3). */
    @Column(nullable = false)
    private int attempts = 0;

    /** True once the OTP has been successfully verified. */
    @Column(nullable = false)
    private boolean verified = false;

    /** Timestamp of the last OTP send — used to enforce 30-second resend cooldown. */
    @Column(nullable = false)
    private LocalDateTime lastSentAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryTime);
    }

    public boolean isResendBlocked() {
        return lastSentAt != null &&
               LocalDateTime.now().isBefore(lastSentAt.plusSeconds(30));
    }

    public long secondsUntilResendAllowed() {
        if (lastSentAt == null) return 0;
        long diff = java.time.Duration.between(LocalDateTime.now(), lastSentAt.plusSeconds(30)).getSeconds();
        return Math.max(0, diff);
    }
}
