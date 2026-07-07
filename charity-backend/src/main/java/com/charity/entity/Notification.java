package com.charity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * In-app notification for users and admin.
 * Every email notification also creates one of these for the dashboard panel.
 */
@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notif_user",   columnList = "user_id"),
    @Index(name = "idx_notif_unread", columnList = "user_id, is_read"),
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NotificationType type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    /** Optional link (e.g. /user/donations, /campaigns/5) */
    @Column(length = 255)
    private String link;

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum NotificationType {
        // Donation
        DONATION_SUCCESS, DONATION_FAILED, DONATION_RECEIPT,
        // Subscription
        SUBSCRIPTION_ACTIVATED, SUBSCRIPTION_REMINDER,
        SUBSCRIPTION_PROCESSED, SUBSCRIPTION_RECEIPT,
        SUBSCRIPTION_MODIFIED, SUBSCRIPTION_DATE_CHANGED,
        SUBSCRIPTION_PAUSED, SUBSCRIPTION_RESUMED, SUBSCRIPTION_CANCELLED,
        // Campaign
        CAMPAIGN_UPDATE, CAMPAIGN_MILESTONE, CAMPAIGN_COMPLETED,
        IMPACT_REPORT,
        // Account
        ACCOUNT_VERIFIED, WELCOME, PROFILE_UPDATED,
        // Admin
        ADMIN_NEW_USER, ADMIN_NEW_SUBSCRIPTION, ADMIN_DONATION,
        ADMIN_CAMPAIGN_UPDATE,
    }
}
