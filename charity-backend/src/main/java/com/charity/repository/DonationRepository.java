package com.charity.repository;

import com.charity.entity.Donation;
import com.charity.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonationRepository extends MongoRepository<Donation, String> {
    List<Donation> findByUserOrderByDonationDateDesc(User user);
    List<Donation> findByUserUserId(String userId);
    List<Donation> findByCampaignCampaignId(String campaignId);
    List<Donation> findByStatus(Donation.DonationStatus status);
    long countByStatus(Donation.DonationStatus status);
}
