package com.charity.dto.campaign;

import com.charity.entity.Campaign;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CampaignRequest {

    @NotBlank(message = "Campaign name required")
    @Size(max = 255)
    private String campaignName;

    @NotBlank(message = "Description required")
    private String description;

    @NotNull(message = "Goal amount required")
    @DecimalMin(value = "100.0", message = "Minimum goal is ₹100")
    private BigDecimal goalAmount;

    @NotNull(message = "Start date required")
    private LocalDate startDate;

    @NotNull(message = "End date required")
    private LocalDate endDate;

    private String imageUrl;
    private String category;
    private Integer beneficiaries;
    private Campaign.UrgencyLevel urgencyLevel;
}
