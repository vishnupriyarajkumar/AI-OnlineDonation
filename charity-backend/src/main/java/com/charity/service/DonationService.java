package com.charity.service;

import com.charity.dto.donation.*;
import com.charity.entity.*;
import com.charity.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DonationService {

    private final DonationRepository donationRepository;
    private final CampaignRepository campaignRepository;
    private final ReceiptRepository receiptRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final EmailService emailService;
    private final BlockchainService blockchainService;
    private final AchievementService achievementService;

    public DonationResponse createDonation(DonationRequest req, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Campaign campaign = campaignRepository.findById(req.getCampaignId())
                .orElseThrow(() -> new RuntimeException("Campaign not found"));

        if (campaign.getStatus() != Campaign.CampaignStatus.ACTIVE) {
            throw new RuntimeException("This campaign is not currently active");
        }

        // Validate remaining amount
        java.math.BigDecimal remaining = campaign.getGoalAmount().subtract(campaign.getCollectedAmount());
        if (remaining.compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("This campaign has already reached its fundraising goal");
        }
        if (req.getAmount().compareTo(remaining) > 0) {
            throw new RuntimeException(
                "You can donate a maximum of \u20b9" + remaining.toPlainString() +
                ". This campaign only requires the remaining amount to reach its goal.");
        }

        Donation donation = Donation.builder()
                .user(user)
                .campaign(campaign)
                .amount(req.getAmount())
                .paymentMethod(req.getPaymentMethod())
                .status(Donation.DonationStatus.PENDING)
                .anonymous(req.getAnonymous() != null ? req.getAnonymous() : false)
                .build();

        donationRepository.save(donation);
        auditLogService.log(user, "DONATION_INITIATED", "Donation", donation.getDonationId(), null,
                "Amount: ₹" + req.getAmount());

        return DonationResponse.from(donation);
    }

    public DonationResponse confirmDonation(String donationId, String transactionId) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new RuntimeException("Donation not found"));

        donation.setStatus(Donation.DonationStatus.SUCCESS);
        donation.setTransactionId(transactionId);
        donationRepository.save(donation);

        // Update campaign collected amount
        Campaign campaign = donation.getCampaign();
        campaign.setCollectedAmount(campaign.getCollectedAmount().add(donation.getAmount()));
        // Auto-close campaign when goal is reached
        if (campaign.getCollectedAmount().compareTo(campaign.getGoalAmount()) >= 0) {
            campaign.setStatus(Campaign.CampaignStatus.CLOSED);
        }
        campaignRepository.save(campaign);

        // Generate receipt — use last 6 chars of MongoDB ObjectId
        String shortId = donationId.length() >= 6
                ? donationId.substring(donationId.length() - 6).toUpperCase()
                : donationId.toUpperCase();
        String receiptNo = "RCP-" + java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + shortId;
        Receipt receipt = Receipt.builder()
                .donation(donation)
                .receiptNumber(receiptNo)
                .build();
        receiptRepository.save(receipt);

        // Send confirmation email only if user has an email address
        User user = donation.getUser();
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            emailService.sendDonationConfirmation(
                    user.getEmail(), user.getFullName(),
                    campaign.getCampaignName(), donation.getAmount(), receiptNo);
        }

        // Record on blockchain (non-blocking, best-effort)
        try {
            blockchainService.recordDonation(donation);
        } catch (Exception e) {
            log.warn("Blockchain recording skipped for donation {}: {}", donationId, e.getMessage());
        }

        // Check and award achievements (non-blocking)
        try {
            achievementService.checkAndAwardAfterDonation(user);
        } catch (Exception e) {
            log.warn("Achievement check failed for user {}: {}", user.getUserId(), e.getMessage());
        }

        auditLogService.log(user, "DONATION_SUCCESS", "Donation", donationId, null,
                "Amount: ₹" + donation.getAmount() + " | Receipt: " + receiptNo);

        DonationResponse resp = DonationResponse.from(donation);
        resp.setReceiptNumber(receiptNo);
        return resp;
    }

    @Transactional(readOnly = true)
    public List<DonationResponse> getMyDonations(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return donationRepository.findByUserUserId(user.getUserId())
                .stream().map(d -> {
                    DonationResponse r = DonationResponse.from(d);
                    receiptRepository.findByDonationDonationId(d.getDonationId())
                            .ifPresent(rec -> r.setReceiptNumber(rec.getReceiptNumber()));
                    return r;
                }).toList();
    }

    @Transactional(readOnly = true)
    public List<DonationResponse> getAllDonations() {
        return donationRepository.findAll().stream().map(d -> {
            DonationResponse r = DonationResponse.from(d);
            receiptRepository.findByDonationDonationId(d.getDonationId())
                    .ifPresent(rec -> r.setReceiptNumber(rec.getReceiptNumber()));
            return r;
        }).toList();
    }
}
