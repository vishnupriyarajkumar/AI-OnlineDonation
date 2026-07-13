package com.charity.service;

import com.charity.entity.Notification;
import com.charity.entity.Notification.NotificationType;
import com.charity.entity.User;
import com.charity.repository.NotificationRepository;
import com.charity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Creates in-app notifications AND triggers the matching email.
 * Every call saves to DB + sends email asynchronously.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository  repo;
    private final UserRepository          userRepository;
    private final EmailService            emailService;

    // ── Core factory ──────────────────────────────────────────

    @Async
    @Transactional
    public void send(User user, NotificationType type, String title,
                     String message, String link, boolean sendEmail) {
        // Persist in-app notification
        repo.save(Notification.builder()
                .user(user).type(type)
                .title(title).message(message)
                .link(link).read(false)
                .build());

        // Send email if user has an email address
        if (sendEmail && user.getEmail() != null && !user.getEmail().isBlank()) {
            emailService.sendNotificationEmail(user.getEmail(), user.getFullName(), title, message, link);
        }
    }

    // ── Subscription notifications ────────────────────────────

    public void subscriptionActivated(User user, String campaignName, String amount) {
        String msg = "Your Monthly Giving subscription of ₹" + amount
                + " for \"" + campaignName + "\" is now active. "
                + "You'll be reminded before each donation.";
        send(user, NotificationType.SUBSCRIPTION_ACTIVATED,
                "🎉 Monthly Giving Activated", msg, "/user/subscription", true);
        notifyAdmin(user, NotificationType.ADMIN_NEW_SUBSCRIPTION,
                "New Monthly Subscriber",
                user.getFullName() + " (" + user.getEmail() + ") subscribed ₹" + amount
                + "/month for \"" + campaignName + "\"");
    }

    public void subscriptionReminder(User user, String campaignName, String amount, String date) {
        String msg = "Your monthly donation of ₹" + amount
                + " for \"" + campaignName + "\" is scheduled for tomorrow (" + date + ").";
        send(user, NotificationType.SUBSCRIPTION_REMINDER,
                "⏰ Upcoming Monthly Donation", msg, "/user/subscription", true);
    }

    public void subscriptionProcessed(User user, String campaignName, String amount, String receiptNo) {
        String msg = "Your monthly donation of ₹" + amount
                + " for \"" + campaignName + "\" was processed successfully. Receipt: " + receiptNo;
        send(user, NotificationType.SUBSCRIPTION_PROCESSED,
                "✅ Monthly Donation Processed", msg, "/user/donations", true);
        notifyAdmin(user, NotificationType.ADMIN_DONATION,
                "Monthly Donation Processed",
                user.getFullName() + " — ₹" + amount + " for \"" + campaignName + "\" | Receipt: " + receiptNo);
    }

    public void subscriptionModified(User user, String oldAmount, String newAmount) {
        String msg = "Your monthly donation amount has been updated from ₹"
                + oldAmount + " to ₹" + newAmount + ".";
        send(user, NotificationType.SUBSCRIPTION_MODIFIED,
                "✏️ Subscription Amount Updated", msg, "/user/subscription", true);
    }

    public void subscriptionDateChanged(User user, int newDay) {
        String msg = "Your monthly donation date has been changed to day " + newDay + " of each month.";
        send(user, NotificationType.SUBSCRIPTION_DATE_CHANGED,
                "📅 Donation Date Changed", msg, "/user/subscription", true);
    }

    public void subscriptionPaused(User user) {
        send(user, NotificationType.SUBSCRIPTION_PAUSED,
                "⏸ Subscription Paused",
                "Your Monthly Giving subscription has been paused. You can resume it anytime.",
                "/user/subscription", true);
        notifyAdmin(user, NotificationType.ADMIN_NEW_SUBSCRIPTION,
                "Subscription Paused", user.getFullName() + " paused their monthly subscription.");
    }

    public void subscriptionResumed(User user, String nextDate) {
        send(user, NotificationType.SUBSCRIPTION_RESUMED,
                "▶️ Subscription Resumed",
                "Your Monthly Giving subscription is active again. Next donation: " + nextDate,
                "/user/subscription", true);
        notifyAdmin(user, NotificationType.ADMIN_NEW_SUBSCRIPTION,
                "Subscription Resumed", user.getFullName() + " resumed their monthly subscription.");
    }

    public void subscriptionCancelled(User user) {
        send(user, NotificationType.SUBSCRIPTION_CANCELLED,
                "❌ Subscription Cancelled",
                "Your Monthly Giving subscription has been cancelled. You can upgrade again anytime.",
                "/user/subscription", true);
        notifyAdmin(user, NotificationType.ADMIN_NEW_SUBSCRIPTION,
                "Subscription Cancelled", user.getFullName() + " cancelled their monthly subscription.");
    }

    // ── Donation notifications ────────────────────────────────

    public void donationSuccess(User user, String campaignName, String amount, String receiptNo) {
        send(user, NotificationType.DONATION_SUCCESS,
                "💜 Donation Successful",
                "Thank you! Your donation of ₹" + amount + " to \"" + campaignName
                + "\" was successful. Receipt: " + receiptNo,
                "/user/donations", true);
        notifyAdmin(user, NotificationType.ADMIN_DONATION,
                "New Donation",
                user.getFullName() + " donated ₹" + amount + " to \"" + campaignName + "\"");
    }

    public void donationFailed(User user, String campaignName, String amount) {
        send(user, NotificationType.DONATION_FAILED,
                "⚠️ Donation Failed",
                "Your donation of ₹" + amount + " to \"" + campaignName
                + "\" could not be processed. Please try again.",
                "/user/donate/" + campaignName, true);
    }

    // ── Campaign notifications ────────────────────────────────

    public void campaignMilestone(User user, String campaignName, int percent) {
        send(user, NotificationType.CAMPAIGN_MILESTONE,
                "🎯 Campaign Milestone!",
                "\"" + campaignName + "\" has reached " + percent + "% of its goal! "
                + "Your support made this possible.",
                "/campaigns", false);
    }

    public void campaignCompleted(User user, String campaignName) {
        send(user, NotificationType.CAMPAIGN_COMPLETED,
                "🏆 Campaign Completed!",
                "\"" + campaignName + "\" has successfully reached its goal! "
                + "Thank you for being part of this journey.",
                "/campaigns", true);
    }

    public void campaignUpdate(User user, String campaignName, String updateText) {
        send(user, NotificationType.CAMPAIGN_UPDATE,
                "📢 Campaign Update",
                "\"" + campaignName + "\": " + updateText,
                "/campaigns", false);
    }

    public void impactReport(User user, String campaignName) {
        send(user, NotificationType.IMPACT_REPORT,
                "📊 Impact Report Available",
                "A new impact report has been uploaded for \"" + campaignName
                + "\". See how your donation made a difference!",
                "/campaigns", true);
    }

    // ── Account notifications ─────────────────────────────────

    public void welcomeNewUser(User user) {
        send(user, NotificationType.WELCOME,
                "💜 Welcome to New Dawn Foundation Trust",
                "Hi " + user.getFullName() + "! Your account is now active. "
                + "Browse our campaigns and start making a difference.",
                "/user", false);
        notifyAdmin(user, NotificationType.ADMIN_NEW_USER,
                "New Donor Registered",
                user.getFullName() + " (" + (user.getEmail() != null ? user.getEmail() : user.getPhone())
                + ") joined the platform.");
    }

    // ── Admin notifications ───────────────────────────────────

    public void notifyAdminOfActivity(User user, String action, String ipAddress, String deviceInfo) {
        String title = "User Activity Alert: " + action;
        String details = String.format(
            "User Details:<br/>" +
            "• <strong>Name:</strong> %s<br/>" +
            "• <strong>Email:</strong> %s<br/>" +
            "• <strong>Role:</strong> %s<br/>" +
            "• <strong>Action:</strong> %s<br/>" +
            "• <strong>IP Address:</strong> %s<br/>" +
            "• <strong>Device Info:</strong> %s",
            user.getFullName(),
            user.getEmail() != null ? user.getEmail() : "N/A (Mobile Only)",
            user.getRole() != null ? user.getRole().getRoleName().name() : "N/A",
            action,
            ipAddress != null ? ipAddress : "Unknown",
            deviceInfo != null ? deviceInfo : "Unknown"
        );

        notifyAdmin(user, NotificationType.ADMIN_NEW_USER, title, details);
    }

    private void notifyAdmin(User actor, NotificationType type, String title, String message) {
        userRepository.findByEmail("newdawnfoundationtrust@gmail.com").ifPresent(admin -> {
            // Save in-app notification for admin
            repo.save(Notification.builder()
                    .user(admin).type(type)
                    .title(title).message(message)
                    .link("/admin").read(false)
                    .build());
            // Email admin
            if (admin.getEmail() != null) {
                emailService.sendAdminAlert(admin.getEmail(), title, message);
            }
        });
    }

    // ── Read / Query ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<Notification> getUserNotifications(User user, Pageable pageable) {
        return repo.findByUserOrderByCreatedAtDesc(user, pageable);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(User user) {
        return repo.countByUserAndReadFalse(user);
    }

    @Transactional(readOnly = true)
    public List<Notification> getUnread(User user) {
        return repo.findByUserAndReadFalseOrderByCreatedAtDesc(user);
    }

    @Transactional
    public void markAllRead(User user) {
        List<Notification> unread = repo.findByUserAndReadFalseOrderByCreatedAtDesc(user);
        unread.forEach(n -> n.setRead(true));
        repo.saveAll(unread);
    }

    @Transactional
    public void markOneRead(String id, User user) {
        repo.findById(id).ifPresent(n -> {
            if (n.getUser().getUserId().equals(user.getUserId())) {
                n.setRead(true);
                repo.save(n);
            }
        });
    }
}
