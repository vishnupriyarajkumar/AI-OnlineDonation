package com.charity.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "achievements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Achievement {

    @Id
    private String achievementId;

    @DBRef
    private User user;

    private AchievementType type;
    private String title;
    private String description;
    private String badgeEmoji;
    private String badgeColor;      // hex color
    private int xpAwarded;

    @Builder.Default
    private Boolean activeFlag = true;

    @Builder.Default
    private Boolean deletedFlag = false;

    @CreatedDate
    private LocalDateTime earnedAt;

    public enum AchievementType {
        FIRST_DONATION,
        FIVE_DONATIONS,
        TEN_DONATIONS,
        AMOUNT_1000,
        AMOUNT_5000,
        AMOUNT_10000,
        VOLUNTEER_JOINED,
        CAMPAIGN_SHARED,
        MONTHLY_HERO,
        EARLY_ADOPTER,
        CONSISTENT_DONOR
    }
}
