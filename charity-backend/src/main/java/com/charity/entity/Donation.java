package com.charity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "donations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long donationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private Campaign campaign;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    @Column(length = 255)
    private String transactionId;

    @CreationTimestamp
    private LocalDateTime donationDate;

    @Enumerated(EnumType.STRING)
    private DonationStatus status = DonationStatus.PENDING;

    private Boolean anonymous = false;

    public enum PaymentMethod {
        UPI, CREDIT_CARD, DEBIT_CARD, NET_BANKING
    }

    public enum DonationStatus {
        PENDING, SUCCESS, FAILED, REFUNDED
    }
}
