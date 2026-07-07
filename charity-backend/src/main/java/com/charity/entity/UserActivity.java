package com.charity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Tracks every significant user action permanently.
 * Never deleted — forms the complete audit trail per user.
 */
@Entity
@Table(name = "user_activities", indexes = {
    @Index(name = "idx_activity_user",      columnList = "user_id"),
    @Index(name = "idx_activity_type",      columnList = "activity_type"),
    @Index(name = "idx_activity_timestamp", columnList = "timestamp"),
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false, length = 50)
    private ActivityType activityType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String ipAddress;

    @Column(length = 300)
    private String metadata; // JSON-like extra info (e.g., campaign name, amount)

    @CreationTimestamp
    private LocalDateTime timestamp;

    public enum ActivityType {
        // Auth
        REGISTERED, EMAIL_VERIFIED, MOBILE_VERIFIED,
        LOGGED_IN, LOGGED_OUT, LOGIN_FAILED, ACCOUNT_LOCKED,
        PASSWORD_CHANGED, PASSWORD_RESET_REQUESTED,

        // Profile
        PROFILE_UPDATED, AVATAR_UPDATED,

        // Donations
        DONATION_INITIATED, DONATION_COMPLETED, DONATION_FAILED,

        // Campaigns
        CAMPAIGN_VIEWED, CAMPAIGN_SHARED,

        // Admin actions
        USER_CREATED, USER_DELETED, USER_LOCKED, USER_UNLOCKED,
        CAMPAIGN_CREATED, CAMPAIGN_UPDATED, CAMPAIGN_DELETED,
        FUND_ALLOCATED, REPORT_GENERATED,
    }
}
