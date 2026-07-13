package com.charity.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "subscriptions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Subscription {

    @Id
    private String id;

    @DBRef
    private User user;

    @DBRef
    private Campaign campaign;

    @Builder.Default
    private DonorType donorType = DonorType.GENERAL;

    @Builder.Default
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;

    private BigDecimal monthlyAmount;

    @Builder.Default
    private int donationDay = 1;

    private LocalDate nextDonationDate;
    private LocalDate lastDonationDate;

    @Builder.Default
    private boolean firstLoginDone = false;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime pausedAt;
    private LocalDateTime cancelledAt;

    public enum DonorType          { GENERAL, MONTHLY }
    public enum SubscriptionStatus { ACTIVE, PAUSED, CANCELLED }

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
