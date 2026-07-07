package com.charity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents a user's Monthly Giving subscription.
 * One active subscription per user at a time.
 */
@Entity
@Table(name = "subscriptions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id")
    private Campaign campaign;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private DonorType donorType = DonorType.GENERAL;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;

    /** Monthly donation amount */
    @Column(precision = 15, scale = 2)
    private BigDecimal monthlyAmount;

    /** Day of month for donation (1–28) */
    @Builder.Default
    private int donationDay = 1;

    /** Next scheduled donation date */
    private LocalDate nextDonationDate;

    /** Last processed donation date */
    private LocalDate lastDonationDate;

    /** Whether this is the user's first login (for onboarding flow) */
    @Builder.Default
    @Column(nullable = false)
    private boolean firstLoginDone = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime pausedAt;
    private LocalDateTime cancelledAt;

    public enum DonorType {
        GENERAL, MONTHLY
    }

    public enum SubscriptionStatus {
        ACTIVE, PAUSED, CANCELLED
    }

    /** Calculates next donation date based on donationDay */
    public LocalDate computeNextDonationDate() {
        LocalDate today = LocalDate.now();
        LocalDate candidate = today.withDayOfMonth(Math.min(donationDay, today.lengthOfMonth()));
        if (!candidate.isAfter(today)) {
            LocalDate next = today.plusMonths(1);
            candidate = next.withDayOfMonth(Math.min(donationDay, next.lengthOfMonth()));
        }
        return candidate;
    }
}
