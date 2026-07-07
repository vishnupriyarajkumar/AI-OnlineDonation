package com.charity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(nullable = false, length = 150)
    private String fullName;

    /** Nullable — mobile-only users may not have email */
    @Column(unique = true, length = 255)
    private String email;

    @Column(nullable = false)
    private String password;

    /** Mobile number — must be unique when provided */
    @Column(length = 20, unique = true)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String address;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    /** True once the user has verified their email OTP after registration */
    @Builder.Default
    @Column(nullable = false)
    private Boolean isVerified = false;

    @Builder.Default
    @Column(nullable = false)
    private Boolean enabled = true;

    @Builder.Default
    @Column(nullable = false)
    private Boolean locked = false;

    /** Consecutive failed login attempts — resets on successful login */
    @Builder.Default
    @Column(nullable = false)
    private int failedLoginAttempts = 0;

    private LocalDateTime lastFailedLogin;

    /** User's preferred language for UI and emails. Default: English */
    @Builder.Default
    @Column(length = 10, nullable = false)
    private String preferredLanguage = "en";

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
