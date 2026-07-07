package com.charity.scheduler;

import com.charity.entity.Subscription;
import com.charity.repository.SubscriptionRepository;
import com.charity.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * Scheduled jobs for Monthly Giving:
 *
 * 1. Daily at 8:00 AM  — send reminder emails to donors whose donation is due tomorrow
 * 2. Daily at 9:00 AM  — process due donations (simulate payment + generate receipt)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SubscriptionScheduler {

    private final SubscriptionRepository subscriptionRepo;
    private final NotificationService    notificationService;

    /**
     * Sends reminder notifications to all monthly donors
     * whose next donation date is tomorrow.
     * Runs every day at 8:00 AM.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void sendDailyReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Subscription> due = subscriptionRepo.findSubscriptionsDueTomorrow(tomorrow);

        log.info("Subscription reminders: {} donor(s) have donations due tomorrow ({})",
                due.size(), tomorrow);

        for (Subscription sub : due) {
            try {
                String campaign = sub.getCampaign() != null
                        ? sub.getCampaign().getCampaignName() : "All Campaigns";
                notificationService.subscriptionReminder(
                        sub.getUser(),
                        campaign,
                        sub.getMonthlyAmount().toPlainString(),
                        tomorrow.toString());
            } catch (Exception e) {
                log.error("Failed to send reminder for subscription {}: {}",
                        sub.getId(), e.getMessage());
            }
        }
    }

    /**
     * Processes monthly donations that are due today.
     * In production this would trigger the payment gateway.
     * Here we simulate success and advance the next donation date.
     * Runs every day at 9:00 AM.
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void processDueSubscriptions() {
        LocalDate today = LocalDate.now();
        List<Subscription> due = subscriptionRepo.findDueSubscriptions(today);

        log.info("Processing {} subscription(s) due on {}", due.size(), today);

        for (Subscription sub : due) {
            try {
                // In real system: trigger Razorpay auto-debit here
                // For now: record as processed and notify
                String receiptNo = "MSUB-" + today.toString().replace("-", "")
                        + "-" + sub.getId();
                String campaign  = sub.getCampaign() != null
                        ? sub.getCampaign().getCampaignName() : "All Campaigns";

                notificationService.subscriptionProcessed(
                        sub.getUser(), campaign,
                        sub.getMonthlyAmount().toPlainString(),
                        receiptNo);

                // Advance to next month
                sub.setLastDonationDate(today);
                sub.setNextDonationDate(sub.computeNextDonationDate());
                subscriptionRepo.save(sub);

                log.info("Processed subscription {} for user {} — ₹{}",
                        sub.getId(), sub.getUser().getEmail(), sub.getMonthlyAmount());
            } catch (Exception e) {
                log.error("Failed to process subscription {}: {}", sub.getId(), e.getMessage());
            }
        }
    }
}
