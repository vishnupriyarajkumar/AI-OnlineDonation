package com.charity.service;

import com.charity.dto.campaign.*;
import com.charity.entity.*;
import com.charity.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public CampaignResponse create(CampaignRequest req, String email) {
        User creator = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Campaign campaign = Campaign.builder()
                .campaignName(req.getCampaignName())
                .description(req.getDescription())
                .goalAmount(req.getGoalAmount())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .imageUrl(req.getImageUrl())
                .category(req.getCategory())
                .beneficiaries(req.getBeneficiaries() != null ? req.getBeneficiaries() : 0)
                .urgencyLevel(req.getUrgencyLevel() != null ? req.getUrgencyLevel() : Campaign.UrgencyLevel.MEDIUM)
                .status(Campaign.CampaignStatus.DRAFT)
                .createdBy(creator)
                .build();

        campaignRepository.save(campaign);
        auditLogService.log(creator, "CAMPAIGN_CREATED", "Campaign", campaign.getCampaignId(), null, campaign.getCampaignName());
        return CampaignResponse.from(campaign);
    }

    public CampaignResponse update(Long id, CampaignRequest req, String email) {
        Campaign campaign = getCampaignOrThrow(id);
        User user = userRepository.findByEmail(email).orElseThrow();

        campaign.setCampaignName(req.getCampaignName());
        campaign.setDescription(req.getDescription());
        campaign.setGoalAmount(req.getGoalAmount());
        campaign.setStartDate(req.getStartDate());
        campaign.setEndDate(req.getEndDate());
        campaign.setImageUrl(req.getImageUrl());
        campaign.setCategory(req.getCategory());
        if (req.getBeneficiaries() != null) campaign.setBeneficiaries(req.getBeneficiaries());
        if (req.getUrgencyLevel() != null) campaign.setUrgencyLevel(req.getUrgencyLevel());

        auditLogService.log(user, "CAMPAIGN_UPDATED", "Campaign", id, null, "Updated");
        return CampaignResponse.from(campaignRepository.save(campaign));
    }

    public CampaignResponse approve(Long id, String adminEmail) {
        Campaign campaign = getCampaignOrThrow(id);
        User admin = userRepository.findByEmail(adminEmail).orElseThrow();

        if (campaign.getStatus() != Campaign.CampaignStatus.DRAFT) {
            throw new RuntimeException("Campaign is not in DRAFT status");
        }

        campaign.setStatus(Campaign.CampaignStatus.ACTIVE);
        auditLogService.log(admin, "CAMPAIGN_APPROVED", "Campaign", id, null, campaign.getCampaignName());
        return CampaignResponse.from(campaignRepository.save(campaign));
    }

    public void delete(Long id, String email) {
        Campaign campaign = getCampaignOrThrow(id);
        User user = userRepository.findByEmail(email).orElseThrow();
        auditLogService.log(user, "CAMPAIGN_DELETED", "Campaign", id, null, campaign.getCampaignName());
        campaignRepository.delete(campaign);
    }

    @Transactional(readOnly = true)
    public List<CampaignResponse> getActiveCampaigns() {
        return campaignRepository.findByStatus(Campaign.CampaignStatus.ACTIVE)
                .stream().map(CampaignResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<CampaignResponse> getAllCampaigns() {
        return campaignRepository.findAll().stream().map(CampaignResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public CampaignResponse getById(Long id) {
        return CampaignResponse.from(getCampaignOrThrow(id));
    }

    public Campaign getCampaignOrThrow(Long id) {
        return campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found: " + id));
    }
}
