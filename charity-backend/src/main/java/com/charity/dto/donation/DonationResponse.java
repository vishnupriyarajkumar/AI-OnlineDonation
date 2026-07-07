package com.charity.dto.donation;

import com.charity.entity.Donation;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonationResponse {
    private Long donationId;
    private String campaignName;
    private String donorName;
    private String donorEmail;
    private BigDecimal amount;
    private Donation.PaymentMethod paymentMethod;
    private String transactionId;
    private LocalDateTime donationDate;
    private Donation.DonationStatus status;
    private Boolean anonymous;
    private String receiptNumber;

    public static DonationResponse from(Donation d) {
        return DonationResponse.builder()
                .donationId(d.getDonationId())
                .campaignName(d.getCampaign().getCampaignName())
                .donorName(Boolean.TRUE.equals(d.getAnonymous()) ? "Anonymous" : d.getUser().getFullName())
                .donorEmail(Boolean.TRUE.equals(d.getAnonymous()) ? null : d.getUser().getEmail())
                .amount(d.getAmount())
                .paymentMethod(d.getPaymentMethod())
                .transactionId(d.getTransactionId())
                .donationDate(d.getDonationDate())
                .status(d.getStatus())
                .anonymous(d.getAnonymous())
                // receiptNumber is set separately after receipt generation
                .build();
    }
}
