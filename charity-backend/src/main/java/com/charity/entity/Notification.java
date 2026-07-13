package com.charity.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "notifications")
@CompoundIndex(def = "{'user.$id': 1, 'read': 1}")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    private String id;

    @DBRef
    private User user;

    private NotificationType type;
    private String title;
    private String message;
    private String link;

    @Builder.Default
    private boolean read = false;

    @CreatedDate
    private LocalDateTime createdAt;

    public enum NotificationType {
        DONATION_SUCCESS, DONATION_FAILED, DONATION_RECEIPT,
        SUBSCRIPTION_ACTIVATED, SUBSCRIPTION_REMINDER,
        SUBSCRIPTION_PROCESSED, SUBSCRIPTION_RECEIPT,
        SUBSCRIPTION_MODIFIED, SUBSCRIPTION_DATE_CHANGED,
        SUBSCRIPTION_PAUSED, SUBSCRIPTION_RESUMED, SUBSCRIPTION_CANCELLED,
        CAMPAIGN_UPDATE, CAMPAIGN_MILESTONE, CAMPAIGN_COMPLETED, IMPACT_REPORT,
        ACCOUNT_VERIFIED, WELCOME, PROFILE_UPDATED,
        ADMIN_NEW_USER, ADMIN_NEW_SUBSCRIPTION, ADMIN_DONATION, ADMIN_CAMPAIGN_UPDATE,
    }
}
