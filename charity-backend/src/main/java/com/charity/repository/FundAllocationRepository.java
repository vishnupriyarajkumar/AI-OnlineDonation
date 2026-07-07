package com.charity.repository;

import com.charity.entity.FundAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FundAllocationRepository extends JpaRepository<FundAllocation, Long> {
    List<FundAllocation> findByCampaignCampaignId(Long campaignId);
}
