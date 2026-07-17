package com.charity.service;

import com.charity.entity.*;
import com.charity.repository.BlockchainTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Simulated Blockchain Service.
 * Uses SHA-256 hash chaining to demonstrate blockchain transparency concepts.
 * Each donation creates a new "block" linked to the previous one.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BlockchainService {

    private final BlockchainTransactionRepository blockchainRepo;

    private static final String GENESIS_HASH =
            "0000000000000000000000000000000000000000000000000000000000000000";

    /**
     * Records a successful donation as a blockchain transaction.
     */
    public BlockchainTransaction recordDonation(Donation donation) {
        try {
            String previousHash = getLatestBlockHash();
            long blockNumber    = blockchainRepo.count() + 1;
            String timestamp    = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

            // Create block data string
            String blockData = buildBlockData(
                    blockNumber, previousHash, timestamp,
                    donation.getDonationId(),
                    donation.getUser() != null ? donation.getUser().getUserId() : "anonymous",
                    donation.getCampaign().getCampaignId(),
                    donation.getAmount()
            );

            String blockHash      = sha256(blockData);
            String txHash         = "0x" + sha256(UUID.randomUUID().toString() + blockData).substring(0, 40);
            String merkleRoot     = sha256(donation.getDonationId() + "|" + donation.getAmount());

            BlockchainTransaction btx = BlockchainTransaction.builder()
                    .blockHash(blockHash)
                    .previousHash(previousHash)
                    .blockNumber(blockNumber)
                    .donation(donation)
                    .donor(donation.getUser())
                    .campaign(donation.getCampaign())
                    .amount(donation.getAmount())
                    .donorName(donation.getAnonymous() ? "Anonymous Donor"
                            : (donation.getUser() != null ? donation.getUser().getFullName() : "Unknown"))
                    .campaignName(donation.getCampaign().getCampaignName())
                    .transactionHash(txHash)
                    .merkleRoot(merkleRoot)
                    .verificationStatus(BlockchainTransaction.VerificationStatus.CONFIRMED)
                    .confirmations(6)
                    .networkName("CharityChain-Testnet")
                    .confirmedAt(LocalDateTime.now())
                    .build();

            BlockchainTransaction saved = blockchainRepo.save(btx);
            log.info("Blockchain recorded: block={}, hash={}, donation={}", blockNumber, blockHash, donation.getDonationId());
            return saved;

        } catch (Exception e) {
            log.error("Failed to record blockchain transaction for donation {}: {}", donation.getDonationId(), e.getMessage());
            return null;
        }
    }

    /**
     * Verifies a blockchain transaction by its hash.
     */
    public boolean verifyTransaction(String txHash) {
        Optional<BlockchainTransaction> opt = blockchainRepo.findByTransactionHash(txHash);
        if (opt.isEmpty()) return false;
        BlockchainTransaction btx = opt.get();
        return btx.getVerificationStatus() == BlockchainTransaction.VerificationStatus.CONFIRMED
                && btx.getConfirmations() >= 6;
    }

    public List<BlockchainTransaction> getUserTransactions(String userId) {
        return blockchainRepo.findByDonorUserIdOrderByCreatedAtDesc(userId);
    }

    public List<BlockchainTransaction> getCampaignTransactions(String campaignId) {
        return blockchainRepo.findByCampaignCampaignIdOrderByCreatedAtDesc(campaignId);
    }

    public List<BlockchainTransaction> getAllTransactions() {
        return blockchainRepo.findAllByOrderByCreatedAtDesc();
    }

    public Optional<BlockchainTransaction> getByDonationId(String donationId) {
        return blockchainRepo.findByDonationDonationId(donationId);
    }

    // ── Private Helpers ────────────────────────────────────────

    private String getLatestBlockHash() {
        return blockchainRepo.findAllByOrderByCreatedAtDesc()
                .stream()
                .findFirst()
                .map(BlockchainTransaction::getBlockHash)
                .orElse(GENESIS_HASH);
    }

    private String buildBlockData(long blockNum, String prevHash, String timestamp,
                                  String donationId, String userId, String campaignId,
                                  BigDecimal amount) {
        return String.format("BLOCK[%d]|PREV[%s]|TIME[%s]|DONATION[%s]|USER[%s]|CAMPAIGN[%s]|AMOUNT[%s]",
                blockNum, prevHash, timestamp, donationId, userId, campaignId, amount.toPlainString());
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
