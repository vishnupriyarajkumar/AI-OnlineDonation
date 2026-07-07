package com.charity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Tracks every login and logout event per user.
 * Persisted permanently — never deleted on logout.
 */
@Entity
@Table(name = "login_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoginHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime loginTime;

    private LocalDateTime logoutTime;

    @Column(length = 50)
    private String ipAddress;

    @Column(length = 255)
    private String deviceInfo;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private LoginStatus status = LoginStatus.SUCCESS;

    public enum LoginStatus { SUCCESS, FAILED, LOCKED }
}
