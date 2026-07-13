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

@Document(collection = "campaigns")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Campaign {

    @Id
    private String campaignId;

    private String campaignName;
    private String description;
    private BigDecimal goalAmount;

    @Builder.Default
    private BigDecimal collectedAmount = BigDecimal.ZERO;

    private LocalDate startDate;
    private LocalDate endDate;
    private String imageUrl;
    private String category;

    @Builder.Default
    private Integer beneficiaries = 0;

    @Builder.Default
    private UrgencyLevel urgencyLevel = UrgencyLevel.MEDIUM;

    @Builder.Default
    private CampaignStatus status = CampaignStatus.DRAFT;

    @DBRef
    private User createdBy;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum CampaignStatus { DRAFT, ACTIVE, COMPLETED, CLOSED }
    public enum UrgencyLevel    { LOW, MEDIUM, HIGH, CRITICAL }
}
