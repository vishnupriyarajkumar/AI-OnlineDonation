package com.charity.service;

import com.charity.dto.donation.*;
import com.charity.entity.*;
import com.charity.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

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

    public DonationResponse createDonation(DonationRequest req, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Campaign campaign = campaignRepository.findById(req.getCampaignId())
                .orElseThrow(() -> new RuntimeException("Campaign not found"));

        if (campaign.getStatus() != Campaign.CampaignStatus.ACTIVE) {
            throw new RuntimeException("This campaign is not currently active");
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
