package com.charity.repository;

import com.charity.entity.FundAllocation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FundAllocationRepository extends MongoRepository<FundAllocation, String> {
    List<FundAllocation> findByCampaignCampaignId(String campaignId);
}

