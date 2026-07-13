package com.charity.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "donations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Donation {

    @Id
    private String donationId;

    @DBRef
    private User user;

    @DBRef
    private Campaign campaign;

    private BigDecimal amount;
    private PaymentMethod paymentMethod;

    @Indexed
    private String transactionId;

    @CreatedDate
    private LocalDateTime donationDate;

    @Builder.Default
    private DonationStatus status = DonationStatus.PENDING;

    @Builder.Default
    private Boolean anonymous = false;

    public enum PaymentMethod  { UPI, CREDIT_CARD, DEBIT_CARD, NET_BANKING }
    public enum DonationStatus { PENDING, SUCCESS, FAILED, REFUNDED, COMPLETED }
}
