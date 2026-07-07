package com.charity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long transactionId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donation_id", nullable = false)
    private Donation donation;

    @Column(nullable = false, length = 255)
    private String razorpayOrderId;

    @Column(length = 255)
    private String razorpayPaymentId;

    @Column(length = 512)
    private String razorpaySignature;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(length = 10)
    private String currency = "INR";

    @Enumerated(EnumType.STRING)
    private TxnStatus status = TxnStatus.CREATED;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum TxnStatus {
        CREATED, CAPTURED, FAILED, REFUNDED
    }
}
