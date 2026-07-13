package com.charity.repository;

import com.charity.entity.Campaign;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CampaignRepository extends MongoRepository<Campaign, String> {
    List<Campaign> findByStatus(Campaign.CampaignStatus status);
    List<Campaign> findByStatusAndCategory(Campaign.CampaignStatus status, String category);
    long countByStatus(Campaign.CampaignStatus status);
    List<Campaign> findByCreatedByUserId(String userId);
}
