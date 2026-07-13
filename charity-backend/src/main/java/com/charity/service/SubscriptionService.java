package com.charity.service;

import com.charity.entity.*;
import com.charity.entity.Subscription.DonorType;
import com.charity.entity.Subscription.SubscriptionStatus;
import com.charity.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Manages donor subscription plans — General and Monthly Giving.
 *
 * Business rules:
 * - Every user has exactly one Subscription record (created at registration).
 * - Default type = GENERAL.
 * - Upgrading to MONTHLY sets amount, donationDay, campaign, nextDonationDate.
 * - Pause/resume/cancel change status only.
 * - firstLoginDone is set to true on first successful login (drives onboarding).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepo;
    private final UserRepository         userRepository;
    private final CampaignRepository     campaignRepository;
    private final NotificationService    notificationService;

    // ── Initialise (called at registration) ──────────────────

    public Subscription createDefault(User user) {
        return subscriptionRepo.save(Subscription.builder()
                .user(user)
                .donorType(DonorType.GENERAL)
                .status(SubscriptionStatus.ACTIVE)
                .firstLoginDone(false)
                .build());
    }

    // ── Onboarding: mark first login done ────────────────────

    public void markFirstLoginDone(User user) {
        getOrCreate(user).setFirstLoginDone(true);
    }

    public boolean isFirstLogin(User user) {
        return !getOrCreate(user).isFirstLoginDone();
    }

    // ── Choose plan (onboarding) ──────────────────────────────

    public Subscription choosePlan(User user, DonorType type,
                                    BigDecimal monthlyAmount, int donationDay,
                                    String campaignId) {
        Subscription sub = getOrCreate(user);
        sub.setDonorType(type);
        sub.setFirstLoginDone(true);

        if (type == DonorType.MONTHLY) {
            applyMonthlySettings(sub, monthlyAmount, donationDay, campaignId);
            sub.setStatus(SubscriptionStatus.ACTIVE);
            notificationService.subscriptionActivated(user,
                    sub.getCampaign() != null ? sub.getCampaign().getCampaignName() : "All Campaigns",
                    monthlyAmount.toPlainString());
        }

        subscriptionRepo.save(sub);
        return sub;
    }

    // ── Upgrade existing GENERAL donor to MONTHLY ─────────────

    public Subscription upgrade(User user, BigDecimal monthlyAmount,
                                 int donationDay, String campaignId) {
        Subscription sub = getOrCreate(user);
        sub.setDonorType(DonorType.MONTHLY);
        sub.setStatus(SubscriptionStatus.ACTIVE);
        applyMonthlySettings(sub, monthlyAmount, donationDay, campaignId);
        subscriptionRepo.save(sub);

        notificationService.subscriptionActivated(user,
                sub.getCampaign() != null ? sub.getCampaign().getCampaignName() : "All Campaigns",
                monthlyAmount.toPlainString());
        log.info("User {} upgraded to Monthly Giving: ₹{}/month", user.getEmail(), monthlyAmount);
        return sub;
    }

    // ── Modify amount ─────────────────────────────────────────

    public Subscription modifyAmount(User user, BigDecimal newAmount) {
        Subscription sub = getOrCreate(user);
        assertMonthly(sub);
        String old = sub.getMonthlyAmount().toPlainString();
        sub.setMonthlyAmount(newAmount);
        subscriptionRepo.save(sub);
        notificationService.subscriptionModified(user, old, newAmount.toPlainString());
        return sub;
    }

    // ── Change donation day ───────────────────────────────────

    public Subscription changeDonationDay(User user, int newDay) {
        Subscription sub = getOrCreate(user);
        assertMonthly(sub);
        sub.setDonationDay(newDay);
        sub.setNextDonationDate(sub.computeNextDonationDate());
        subscriptionRepo.save(sub);
        notificationService.subscriptionDateChanged(user, newDay);
        return sub;
    }

    // ── Pause ─────────────────────────────────────────────────

    public Subscription pause(User user) {
        Subscription sub = getOrCreate(user);
        assertMonthly(sub);
        if (sub.getStatus() == SubscriptionStatus.PAUSED)
            throw new RuntimeException("Subscription is already paused.");
        sub.setStatus(SubscriptionStatus.PAUSED);
        sub.setPausedAt(LocalDateTime.now());
        subscriptionRepo.save(sub);
        notificationService.subscriptionPaused(user);
        return sub;
    }

    // ── Resume ────────────────────────────────────────────────

    public Subscription resume(User user) {
        Subscription sub = getOrCreate(user);
        assertMonthly(sub);
        if (sub.getStatus() != SubscriptionStatus.PAUSED)
            throw new RuntimeException("Subscription is not paused.");
        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setPausedAt(null);
        sub.setNextDonationDate(sub.computeNextDonationDate());
        subscriptionRepo.save(sub);
        notificationService.subscriptionResumed(user, sub.getNextDonationDate().toString());
        return sub;
    }

    // ── Cancel ────────────────────────────────────────────────

    public Subscription cancel(User user) {
        Subscription sub = getOrCreate(user);
        assertMonthly(sub);
        sub.setStatus(SubscriptionStatus.CANCELLED);
        sub.setDonorType(DonorType.GENERAL);
        sub.setCancelledAt(LocalDateTime.now());
        subscriptionRepo.save(sub);
        notificationService.subscriptionCancelled(user);
        return sub;
    }

    // ── Get subscription ──────────────────────────────────────

    @Transactional(readOnly = true)
    public Subscription getSubscription(User user) {
        return getOrCreate(user);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSubscriptionSummary(User user) {
        Subscription sub = getOrCreate(user);
        Map<String, Object> map = new HashMap<>();
        map.put("donorType",       sub.getDonorType().name());
        map.put("status",          sub.getStatus().name());
        map.put("monthlyAmount",   sub.getMonthlyAmount());
        map.put("donationDay",     sub.getDonationDay());
        map.put("nextDonationDate",sub.getNextDonationDate());
        map.put("lastDonationDate",sub.getLastDonationDate());
        map.put("firstLoginDone",  sub.isFirstLoginDone());
        map.put("campaignId",      sub.getCampaign() != null ? sub.getCampaign().getCampaignId() : null);
        map.put("campaignName",    sub.getCampaign() != null ? sub.getCampaign().getCampaignName() : null);
        return map;
    }

    // ── Admin stats ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getAdminStats() {
        Map<String, Object> m = new HashMap<>();
        m.put("totalMonthly",    subscriptionRepo.countByDonorType(DonorType.MONTHLY));
        m.put("activeMonthly",   subscriptionRepo.countByDonorTypeAndStatus(DonorType.MONTHLY, SubscriptionStatus.ACTIVE));
        m.put("pausedMonthly",   subscriptionRepo.countByDonorTypeAndStatus(DonorType.MONTHLY, SubscriptionStatus.PAUSED));
        m.put("cancelledMonthly",subscriptionRepo.countByDonorTypeAndStatus(DonorType.MONTHLY, SubscriptionStatus.CANCELLED));
        m.put("totalGeneral",    subscriptionRepo.countByDonorType(DonorType.GENERAL));

        // Upcoming donations in next 7 days
        long upcoming = subscriptionRepo.findByDonorTypeAndStatus(com.charity.entity.Subscription.DonorType.MONTHLY, com.charity.entity.Subscription.SubscriptionStatus.ACTIVE).stream()
                .filter(s -> s.getNextDonationDate() != null &&
                        !s.getNextDonationDate().isAfter(LocalDate.now().plusDays(7)))
                .count();
        m.put("upcomingDonations7Days", upcoming);
        return m;
    }

    // ── Private helpers ───────────────────────────────────────

    private Subscription getOrCreate(User user) {
        return subscriptionRepo.findByUser(user)
                .orElseGet(() -> {
                    // If user is already verified (existing/seeded user), mark first login done
                    // to prevent unexpected onboarding redirect
                    boolean alreadyDone = Boolean.TRUE.equals(user.getIsVerified());
                    return subscriptionRepo.save(Subscription.builder()
                            .user(user).donorType(DonorType.GENERAL)
                            .status(SubscriptionStatus.ACTIVE)
                            .firstLoginDone(alreadyDone)
                            .build());
                });
    }

    private void assertMonthly(Subscription sub) {
        if (sub.getDonorType() != DonorType.MONTHLY)
            throw new RuntimeException("Upgrade to Monthly Giving first.");
    }

    private void applyMonthlySettings(Subscription sub, BigDecimal amount,
                                       int day, String campaignId) {
        sub.setMonthlyAmount(amount);
        sub.setDonationDay(Math.max(1, Math.min(28, day)));
        sub.setNextDonationDate(sub.computeNextDonationDate());
        if (campaignId != null) {
            campaignRepository.findById(campaignId).ifPresent(sub::setCampaign);
        }
    }
}
