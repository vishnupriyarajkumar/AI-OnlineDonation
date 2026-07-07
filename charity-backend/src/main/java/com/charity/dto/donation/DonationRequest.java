package com.charity.dto.donation;

import com.charity.entity.Donation;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class DonationRequest {

    @NotNull(message = "Campaign ID required")
    private Long campaignId;

    @NotNull(message = "Amount required")
    @DecimalMin(value = "10.0", message = "Minimum donation is ₹10")
    private BigDecimal amount;

    @NotNull(message = "Payment method required")
    private Donation.PaymentMethod paymentMethod;

    private Boolean anonymous = false;
}
