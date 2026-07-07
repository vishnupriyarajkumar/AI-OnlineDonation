package com.charity.repository;

import com.charity.entity.Donation;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface DonationRepository extends JpaRepository<Donation, Long> {
    List<Donation> findByUserUserIdOrderByDonationDateDesc(Long userId);
    List<Donation> findByCampaignCampaignId(Long campaignId);
    List<Donation> findByStatus(Donation.DonationStatus status);

    @Query("SELECT COALESCE(SUM(d.amount),0) FROM Donation d WHERE d.status = 'SUCCESS'")
    BigDecimal sumSuccessfulDonations();

    @Query("SELECT COALESCE(SUM(d.amount),0) FROM Donation d WHERE d.status = 'SUCCESS'")
    BigDecimal totalSuccessfulDonations();

    @Query("SELECT MONTH(d.donationDate) as month, SUM(d.amount) as total " +
           "FROM Donation d WHERE d.status='SUCCESS' AND YEAR(d.donationDate) = :year " +
           "GROUP BY MONTH(d.donationDate)")
    List<Object[]> monthlyDonations(int year);
}
