package com.charity.repository;

import com.charity.entity.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    List<Campaign> findByStatus(Campaign.CampaignStatus status);
    List<Campaign> findByStatusAndCategory(Campaign.CampaignStatus status, String category);
    long countByStatus(Campaign.CampaignStatus status);

    @Query("SELECT COUNT(c) FROM Campaign c WHERE c.status = 'ACTIVE'")
    long countActiveCampaigns();

    @Query("SELECT SUM(c.collectedAmount) FROM Campaign c")
    java.math.BigDecimal totalRaised();

    List<Campaign> findByCreatedByUserId(Long userId);
}
