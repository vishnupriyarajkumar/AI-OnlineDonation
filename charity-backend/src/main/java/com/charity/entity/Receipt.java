package com.charity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "receipts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Receipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long receiptId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donation_id", nullable = false, unique = true)
    private Donation donation;

    @Column(nullable = false, unique = true, length = 50)
    private String receiptNumber;

    @CreationTimestamp
    private LocalDateTime issuedAt;

    @Column(length = 500)
    private String pdfUrl;
}
