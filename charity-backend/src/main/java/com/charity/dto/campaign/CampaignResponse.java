package com.charity.dto.campaign;

import com.charity.entity.Campaign;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CampaignResponse {
    private String campaignId;
    private String campaignName;
    private String description;
    private BigDecimal goalAmount;
    private BigDecimal collectedAmount;
    private BigDecimal remainingAmount;
    private double progressPercent;
    private LocalDate startDate;
    private LocalDate endDate;
    private long daysRemaining;
    private String imageUrl;
    private String category;
    private Integer beneficiaries;
    private Campaign.UrgencyLevel urgencyLevel;
    private Campaign.CampaignStatus status;
    private String createdBy;
    private LocalDateTime createdAt;

    public static CampaignResponse from(Campaign c) {
        BigDecimal remaining = c.getGoalAmount().subtract(c.getCollectedAmount());
        double progress = c.getGoalAmount().compareTo(BigDecimal.ZERO) == 0 ? 0 :
                c.getCollectedAmount().divide(c.getGoalAmount(), 4, java.math.RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).doubleValue();

        return CampaignResponse.builder()
                .campaignId(c.getCampaignId())
                .campaignName(c.getCampaignName())
                .description(c.getDescription())
                .goalAmount(c.getGoalAmount())
                .collectedAmount(c.getCollectedAmount())
                .remainingAmount(remaining.max(BigDecimal.ZERO))
                .progressPercent(Math.min(progress, 100.0))
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .daysRemaining(Math.max(0, ChronoUnit.DAYS.between(LocalDate.now(), c.getEndDate())))
                .imageUrl(c.getImageUrl())
                .category(c.getCategory())
                .beneficiaries(c.getBeneficiaries())
                .urgencyLevel(c.getUrgencyLevel())
                .status(c.getStatus())
                .createdBy(c.getCreatedBy() != null ? c.getCreatedBy().getFullName() : null)
                .createdAt(c.getCreatedAt())
                .build();
    }
}
