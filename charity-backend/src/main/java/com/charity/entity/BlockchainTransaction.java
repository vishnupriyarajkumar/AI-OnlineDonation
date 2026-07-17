package com.charity.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "blockchain_transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BlockchainTransaction {

    @Id
    private String id;

    @Indexed(unique = true)
    private String blockHash;          // SHA-256 hash of the block data

    private String previousHash;        // Previous block hash (chain)
    private Long blockNumber;           // Simulated block number

    @DBRef
    private Donation donation;

    @DBRef
    private User donor;

    @DBRef
    private Campaign campaign;

    private BigDecimal amount;
    private String donorName;           // Snapshot at time of donation
    private String campaignName;        // Snapshot
    private String transactionHash;     // Unique tx hash
    private String merkleRoot;          // Simulated merkle root

    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.CONFIRMED;

    @Builder.Default
    private String networkName = "CharityChain-Testnet";

    @Builder.Default
    private Integer confirmations = 6;

    @Builder.Default
    private Boolean activeFlag = true;

    @Builder.Default
    private Boolean deletedFlag = false;

    @CreatedDate
    private LocalDateTime createdAt;

    private LocalDateTime confirmedAt;

    public enum VerificationStatus { PENDING, CONFIRMED, FAILED }
}
