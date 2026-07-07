package com.charity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Persistent refresh token for "Remember Me" sessions (30 days)
 * and standard refresh token rotation (7 days).
 *
 * One record per user — replaced on each new login.
 */
@Entity
@Table(name = "refresh_tokens")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, unique = true, length = 512)
    private String token;

    /** When this token expires */
    @Column(nullable = false)
    private LocalDateTime expiryDate;

    /** True = 30-day Remember Me token; false = standard 7-day token */
    @Builder.Default
    @Column(nullable = false)
    private boolean rememberMe = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryDate);
    }
}
