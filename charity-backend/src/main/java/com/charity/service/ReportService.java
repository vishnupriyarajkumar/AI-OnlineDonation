package com.charity.service;

import com.charity.entity.*;
import com.charity.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final DonationRepository      donationRepository;
    private final CampaignRepository      campaignRepository;
    private final UserRepository          userRepository;
    private final FundAllocationRepository fundAllocationRepository;

    // ── Public stats (used by Home page hero section) ────────
    public Map<String, Object> getPublicStats() {
        long totalCampaigns = campaignRepository.countByStatus(Campaign.CampaignStatus.ACTIVE);
        long totalDonors    = userRepository.countByRoleRoleName(Role.RoleName.USER);

        BigDecimal totalRaised = donationRepository
                .findByStatus(Donation.DonationStatus.SUCCESS)
                .stream()
                .map(Donation::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalVolunteers = userRepository.count();

        return Map.of(
            "totalCampaigns",   totalCampaigns,
            "totalDonors",      totalDonors,
            "totalRaised",      totalRaised,
            "totalVolunteers",  totalVolunteers
        );
    }

    // ── Monthly donations chart (replaces JPQL GROUP BY) ─────
    public List<Map<String, Object>> getMonthlyDonations(int year) {
        List<Donation> successful = donationRepository.findByStatus(Donation.DonationStatus.SUCCESS);

        // Group by month and sum amounts
        Map<Integer, BigDecimal> byMonth = new TreeMap<>();
        for (int m = 1; m <= 12; m++) byMonth.put(m, BigDecimal.ZERO);

        successful.forEach(d -> {
            if (d.getDonationDate() != null &&
                d.getDonationDate().getYear() == year) {
                int month = d.getDonationDate().getMonthValue();
                byMonth.merge(month, d.getAmount() != null ? d.getAmount() : BigDecimal.ZERO, BigDecimal::add);
            }
        });

        String[] monthNames = {"Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"};
        return byMonth.entrySet().stream()
                .map(e -> Map.<String, Object>of(
                    "month",  monthNames[e.getKey() - 1],
                    "amount", e.getValue()))
                .collect(Collectors.toList());
    }

    // ── Admin stats ───────────────────────────────────────────
    public Map<String, Object> getAdminStats() {
        long totalDonations  = donationRepository.count();
        long activeCampaigns = campaignRepository.countByStatus(Campaign.CampaignStatus.ACTIVE);
        long totalUsers      = userRepository.count();
        long lockedUsers     = userRepository.countByLocked(true);

        BigDecimal totalAmount = donationRepository
                .findByStatus(Donation.DonationStatus.SUCCESS)
                .stream()
                .map(Donation::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
            "totalDonations",   totalDonations,
            "totalAmount",      totalAmount,
            "activeCampaigns",  activeCampaigns,
            "totalUsers",       totalUsers,
            "lockedUsers",      lockedUsers
        );
    }

    // ── Campaign report ───────────────────────────────────────
    public Map<String, Object> getCampaignReport(String campaignId) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));

        List<Donation> donations = donationRepository.findByCampaignCampaignId(campaignId);
        BigDecimal total = donations.stream()
                .filter(d -> d.getStatus() == Donation.DonationStatus.SUCCESS)
                .map(d -> d.getAmount() != null ? d.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<FundAllocation> allocations = fundAllocationRepository.findByCampaignCampaignId(campaignId);
        BigDecimal allocated = allocations.stream()
                .map(a -> a.getAmount() != null ? a.getAmount() : BigDecimal.ZERO)
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
