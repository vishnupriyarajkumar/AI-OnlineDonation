package com.charity.service;

import com.charity.entity.*;
import com.charity.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final DonationRepository donationRepository;
    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;
    private final FundAllocationRepository fundAllocationRepository;

    public Map<String, Object> getPublicStats() {
        long totalCampaigns  = campaignRepository.countActiveCampaigns();
        long totalDonors     = userRepository.countByRoleRoleName(Role.RoleName.USER);
        BigDecimal totalRaised = donationRepository.totalSuccessfulDonations();

        return Map.of(
            "totalCampaigns",  totalCampaigns,
            "totalDonors",     totalDonors,
            "totalRaised",     totalRaised != null ? totalRaised : BigDecimal.ZERO
        );
    }

    public List<Object[]> getMonthlyDonations(int year) {
        return donationRepository.monthlyDonations(year);
    }

    public Map<String, Object> getCampaignReport(Long campaignId) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));

        List<Donation> donations = donationRepository.findByCampaignCampaignId(campaignId);
        BigDecimal total = donations.stream()
                .filter(d -> d.getStatus() == Donation.DonationStatus.SUCCESS)
                .map(Donation::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<FundAllocation> allocations = fundAllocationRepository.findByCampaignCampaignId(campaignId);
        BigDecimal allocated = allocations.stream().map(FundAllocation::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
            "campaignName",    campaign.getCampaignName(),
            "goalAmount",      campaign.getGoalAmount(),
            "collectedAmount", campaign.getCollectedAmount(),
            "totalDonations",  donations.size(),
            "totalAllocated",  allocated,
            "status",          campaign.getStatus()
        );
    }
}
