package com.charity.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Transaction {

    @Id
    private String transactionId;

    @DBRef
    private Donation donation;

    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
    private BigDecimal amount;

    @Builder.Default
    private String currency = "INR";

    @Builder.Default
    private TxnStatus status = TxnStatus.CREATED;

    @CreatedDate
    private LocalDateTime createdAt;

    public enum TxnStatus { CREATED, CAPTURED, FAILED, REFUNDED }
}
