package com.charity.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "user_activities")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserActivity {

    @Id
    private String id;

    @DBRef
    private User user;

    private ActivityType activityType;
    private String description;
    private String ipAddress;
    private String metadata;

    @CreatedDate
    private LocalDateTime timestamp;

    public enum ActivityType {
        REGISTERED, EMAIL_VERIFIED, MOBILE_VERIFIED,
        LOGGED_IN, LOGGED_OUT, LOGIN_FAILED, ACCOUNT_LOCKED,
        PASSWORD_CHANGED, PASSWORD_RESET_REQUESTED,
        PROFILE_UPDATED, AVATAR_UPDATED,
        DONATION_INITIATED, DONATION_COMPLETED, DONATION_FAILED,
        CAMPAIGN_VIEWED, CAMPAIGN_SHARED,
        USER_CREATED, USER_DELETED, USER_LOCKED, USER_UNLOCKED,
        CAMPAIGN_CREATED, CAMPAIGN_UPDATED, CAMPAIGN_DELETED,
        FUND_ALLOCATED, REPORT_GENERATED,
    }
}
