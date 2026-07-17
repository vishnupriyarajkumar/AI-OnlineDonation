package com.charity.repository;

import com.charity.entity.BlockchainTransaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlockchainTransactionRepository extends MongoRepository<BlockchainTransaction, String> {
    Optional<BlockchainTransaction> findByBlockHash(String blockHash);
    Optional<BlockchainTransaction> findByTransactionHash(String transactionHash);
    Optional<BlockchainTransaction> findByDonationDonationId(String donationId);
    List<BlockchainTransaction> findByDonorUserIdOrderByCreatedAtDesc(String userId);
    List<BlockchainTransaction> findByCampaignCampaignIdOrderByCreatedAtDesc(String campaignId);
    List<BlockchainTransaction> findAllByOrderByCreatedAtDesc();
    long count();
}
