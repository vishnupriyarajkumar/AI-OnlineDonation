package com.charity.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;



    /**
     * Sends a 2FA OTP code to the user's email address.
     * Runs asynchronously so login response is not delayed.
     */
    @Async
    public void sendOtp(String to, String name, String otp) {
        String subject = "Your CharityOrg Verification Code";
        String body = """
            <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#0d0d1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
              <div style="background:linear-gradient(135deg,#6c3ce8,#8b5cf6);padding:28px 32px;text-align:center">
                <div style="font-size:32px;margin-bottom:8px">🔐</div>
                <h2 style="color:#fff;margin:0;font-size:22px;font-weight:800">Two-Factor Authentication</h2>
                <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px">CharityOrg Security</p>
              </div>
              <div style="padding:32px">
                <p style="color:#e0e0ff;font-size:16px;margin-bottom:8px">Hi <strong>%s</strong>,</p>
                <p style="color:#9090b0;font-size:14px;margin-bottom:24px">Use the verification code below to complete your login. This code expires in <strong style="color:#a78bfa">5 minutes</strong>.</p>
                <div style="background:rgba(108,60,232,0.15);border:2px dashed rgba(108,60,232,0.5);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
                  <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#a78bfa;font-family:monospace">%s</div>
                </div>
                <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:14px;margin-bottom:20px">
                  <p style="color:#fca5a5;font-size:13px;margin:0">⚠️ <strong>Never share this code</strong> with anyone. CharityOrg staff will never ask for your OTP.</p>
                </div>
                <p style="color:#9090b0;font-size:12px">If you didn't request this code, your account may be at risk. Please change your password immediately.</p>
              </div>
              <div style="background:rgba(255,255,255,0.03);padding:16px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06)">
                <p style="color:#9090b0;font-size:12px;margin:0">© 2024 New Dawn Foundation Trust • Secured with BCrypt & JWT</p>
              </div>
            </div>
            """.formatted(name, otp);
        sendHtml(to, subject, body);
    }

    @Async
    public void sendWelcomeEmail(String to, String name) {
        String subject = "Welcome to CharityOrg — Your Account is Ready!";
        String body = """
            <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#0d0d1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
              <div style="background:linear-gradient(135deg,#6c3ce8,#10b981);padding:28px 32px;text-align:center">
                <div style="font-size:40px;margin-bottom:8px">💜</div>
                <h2 style="color:#fff;margin:0;font-size:22px;font-weight:800">Welcome to CharityOrg!</h2>
              </div>
              <div style="padding:32px">
                <p style="color:#e0e0ff;font-size:16px">Hi <strong>%s</strong>,</p>
                <p style="color:#9090b0;font-size:14px;">Your account has been created successfully. You can now explore campaigns and start making a difference.</p>
                <p style="color:#a78bfa;font-weight:700;font-size:14px;margin-top:20px">Together, we make the world better. 💜</p>
              </div>
            </div>
            """.formatted(name);
        sendHtml(to, subject, body);
    }

    @Async
    public void sendPasswordResetOtp(String to, String name, String otp) {
        String subject = "🔐 Password Reset Code — New Dawn Foundation Trust";
        String body = """
            <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;background:#0d0d1a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
              <div style="background:linear-gradient(135deg,#ef4444,#f59e0b);padding:28px 32px;text-align:center">
                <div style="font-size:32px;margin-bottom:8px">🔐</div>
                <h2 style="color:#fff;margin:0;font-size:22px;font-weight:800">Password Reset Request</h2>
                <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px">New Dawn Foundation Trust</p>
              </div>
              <div style="padding:32px">
                <p style="color:#e0e0ff;font-size:16px;margin-bottom:8px">Hi <strong>%s</strong>,</p>
                <p style="color:#9090b0;font-size:14px;margin-bottom:24px">Use this code to reset your password. This code expires in <strong style="color:#f59e0b">5 minutes</strong>.</p>
                <div style="background:rgba(239,68,68,0.12);border:2px dashed rgba(239,68,68,0.4);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
                  <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#f87171;font-family:monospace">%s</div>
                </div>
                <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:14px;margin-bottom:20px">
                  <p style="color:#fca5a5;font-size:13px;margin:0">⚠️ If you did NOT request this, please ignore this email. Your password will not change.</p>
                </div>
                <p style="color:#9090b0;font-size:12px">This code is valid for one-time use only and expires in 5 minutes.</p>
              </div>
              <div style="background:rgba(255,255,255,0.03);padding:16px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06)">
                <p style="color:#9090b0;font-size:12px;margin:0">© 2024 New Dawn Foundation Trust</p>
              </div>
            </div>
            """.formatted(name, otp);
        sendHtml(to, subject, body);
    }

    @Async
    public void sendSubscriptionActivated(String to, String name,
                                           String campaign, String amount) {
        String subject = "💜 Monthly Giving Activated — New Dawn Foundation Trust";
        String body = template("Monthly Giving Activated! 🎉",
                "Thank you for becoming a Monthly Giving donor, <strong>" + name + "</strong>!",
                new String[][]{
                    entry("Campaign",        campaign),
                    entry("Monthly Amount",  "₹" + amount),
                    entry("Status",          "✅ Active")
                },
                "You'll receive a reminder before each donation and a receipt after every payment.",
                "#6c3ce8");
        sendHtml(to, subject, body);
    }

    @Async
    public void sendSubscriptionReminder(String to, String name,
                                          String campaign, String amount, String date) {
        String subject = "⏰ Upcoming Monthly Donation — Tomorrow";
        String body = template("Donation Due Tomorrow",
                "Hi <strong>" + name + "</strong>, your monthly donation is scheduled for tomorrow.",
                new String[][]{
                    entry("Campaign",   campaign),
                    entry("Amount",     "₹" + amount),
                    entry("Date",       date)
                },
                "Ensure sufficient balance in your payment method. We'll process it automatically.",
                "#f59e0b");
        sendHtml(to, subject, body);
    }

    @Async
    public void sendMonthlyDonationReceipt(String to, String name,
                                            String campaign, String amount, String receiptNo) {
        String subject = "✅ Monthly Donation Processed — Receipt #" + receiptNo;
        String body = template("Monthly Donation Successful! 💜",
                "Your monthly donation was processed successfully, <strong>" + name + "</strong>.",
                new String[][]{
                    entry("Campaign",    campaign),
                    entry("Amount",      "₹" + amount),
                    entry("Receipt No.", receiptNo),
                    entry("Type",        "Monthly Giving"),
                    entry("80G",         "✅ Tax Exempt")
                },
                "Thank you for your continued support! Your generosity makes a real difference.",
                "#10b981");
        sendHtml(to, subject, body);
    }

    @Async
    public void sendSubscriptionModified(String to, String name,
                                          String oldAmt, String newAmt) {
        String subject = "✏️ Monthly Donation Amount Updated";
        String body = template("Subscription Amount Updated",
                "Hi <strong>" + name + "</strong>, your monthly donation amount has been updated.",
                new String[][]{
                    entry("Previous Amount", "₹" + oldAmt),
                    entry("New Amount",      "₹" + newAmt),
                    entry("Effective",       "Next billing cycle")
                },
                "Thank you for your continued support!",
                "#6c3ce8");
        sendHtml(to, subject, body);
    }

    @Async
    public void sendSubscriptionPaused(String to, String name) {
        String subject = "⏸ Your Monthly Giving Subscription is Paused";
        String body = template("Subscription Paused",
                "Hi <strong>" + name + "</strong>, your Monthly Giving subscription has been paused.",
                new String[][]{ entry("Status", "⏸ Paused") },
                "You can resume your subscription anytime from your dashboard.",
                "#f59e0b");
        sendHtml(to, subject, body);
    }

    @Async
    public void sendSubscriptionResumed(String to, String name, String nextDate) {
        String subject = "▶️ Monthly Giving Subscription Resumed";
        String body = template("Subscription Resumed! 🎉",
                "Hi <strong>" + name + "</strong>, your Monthly Giving subscription is active again.",
                new String[][]{
                    entry("Status",        "✅ Active"),
                    entry("Next Donation", nextDate)
                },
                "Thank you for continuing your support!",
                "#10b981");
        sendHtml(to, subject, body);
    }

    @Async
    public void sendSubscriptionCancelled(String to, String name) {
        String subject = "❌ Monthly Giving Subscription Cancelled";
        String body = template("Subscription Cancelled",
                "Hi <strong>" + name + "</strong>, your Monthly Giving subscription has been cancelled.",
                new String[][]{ entry("Status", "❌ Cancelled") },
                "You can always upgrade to Monthly Giving again from your dashboard. "
                + "Thank you for your past support!",
                "#ef4444");
        sendHtml(to, subject, body);
    }

    // ── Campaign emails ───────────────────────────────────────

    @Async
    public void sendCampaignMilestone(String to, String name,
                                       String campaign, int percent) {
        String subject = "🎯 Campaign Milestone — " + campaign;
        String body = template("Campaign Milestone Reached!",
                "Hi <strong>" + name + "</strong>, a campaign you support has hit a milestone.",
                new String[][]{
                    entry("Campaign",   campaign),
                    entry("Progress",   percent + "% of goal reached")
                },
                "Your support is making a real difference. Thank you!",
                "#f59e0b");
        sendHtml(to, subject, body);
    }

    @Async
    public void sendCampaignCompleted(String to, String name, String campaign) {
        String subject = "🏆 Campaign Completed — " + campaign;
        String body = template("Campaign Successfully Completed!",
                "Hi <strong>" + name + "</strong>, a campaign you supported has been completed!",
                new String[][]{ entry("Campaign", campaign), entry("Status", "✅ Completed") },
                "Thank you for being part of this success story. Together we made it happen!",
                "#10b981");
        sendHtml(to, subject, body);
    }

    @Async
    public void sendImpactReport(String to, String name, String campaign) {
        String subject = "📊 Impact Report Available — " + campaign;
        String body = template("New Impact Report Available",
                "Hi <strong>" + name + "</strong>, a new impact report has been uploaded.",
                new String[][]{ entry("Campaign", campaign) },
                "Log in to see how your donation created real impact in the community.",
                "#6c3ce8");
        sendHtml(to, subject, body);
    }

    // ── Admin alert ───────────────────────────────────────────

    @Async
    public void sendAdminAlert(String to, String title, String details) {
        String body = """
            <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;
                        background:#0d0d1a;border-radius:16px;overflow:hidden;
                        border:1px solid rgba(255,255,255,0.08)">
              <div style="background:linear-gradient(135deg,#6c3ce8,#8b5cf6);
                          padding:20px 28px">
                <h2 style="color:#fff;margin:0;font-size:18px">🔔 Admin Alert</h2>
                <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">
                  New Dawn Foundation Trust — System Notification
                </p>
              </div>
              <div style="padding:24px">
                <h3 style="color:#e0e0ff;font-size:16px;margin-bottom:12px">%s</h3>
                <p style="color:#9090b0;font-size:14px;line-height:1.6">%s</p>
              </div>
              <div style="background:rgba(255,255,255,0.03);padding:14px 28px;
                          text-align:center;border-top:1px solid rgba(255,255,255,0.06)">
                <p style="color:#9090b0;font-size:12px;margin:0">
                  © 2024 New Dawn Foundation Trust
                </p>
              </div>
            </div>""".formatted(title, details);
        sendHtml(to, "🔔 " + title, body);
    }

    // ── Generic notification email ────────────────────────────

    @Async
    public void sendNotificationEmail(String to, String name,
                                       String title, String message, String link) {
        String actionHtml = link != null && !link.isBlank()
                ? "<a href='http://localhost:5173" + link + "' style='"
                + "display:inline-block;background:linear-gradient(135deg,#6c3ce8,#8b5cf6);"
                + "color:#fff;padding:12px 28px;border-radius:8px;font-weight:700;"
                + "text-decoration:none;margin-top:16px'>View Details →</a>"
                : "";
        String body = """
            <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;
                        background:#0d0d1a;border-radius:16px;overflow:hidden;
                        border:1px solid rgba(255,255,255,0.08)">
              <div style="background:linear-gradient(135deg,#6c3ce8,#8b5cf6);
                          padding:24px 32px;text-align:center">
                <h2 style="color:#fff;margin:0;font-size:20px;font-weight:800">%s</h2>
                <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">
                  New Dawn Foundation Trust
                </p>
              </div>
              <div style="padding:28px 32px;text-align:center">
                <p style="color:#e0e0ff;font-size:15px">Hi <strong>%s</strong>,</p>
                <p style="color:#9090b0;font-size:14px;line-height:1.7;margin-top:12px">%s</p>
                %s
              </div>
              <div style="background:rgba(255,255,255,0.03);padding:14px;
                          text-align:center;border-top:1px solid rgba(255,255,255,0.06)">
                <p style="color:#9090b0;font-size:12px;margin:0">
                  © 2024 New Dawn Foundation Trust • Secured with BCrypt & JWT
                </p>
              </div>
            </div>""".formatted(title, name, message, actionHtml);
        sendHtml(to, title, body);
    }

    // ── Private helpers ───────────────────────────────────────

    private String template(String heading, String intro,
                             String[][] rows, String footer, String color) {
        StringBuilder sb = new StringBuilder();
        sb.append("""
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;
                        background:#0d0d1a;border-radius:16px;overflow:hidden;
                        border:1px solid rgba(255,255,255,0.08)">
              <div style="background:linear-gradient(135deg,%s,#8b5cf6);
                          padding:24px 32px;text-align:center">
                <div style="font-size:36px;margin-bottom:8px">💜</div>
                <h2 style="color:#fff;margin:0;font-size:20px;font-weight:800">%s</h2>
                <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">
                  New Dawn Foundation Trust</p>
              </div>
              <div style="padding:28px 32px">
                <p style="color:#e0e0ff;font-size:15px;margin-bottom:20px">%s</p>
                <table style="width:100%%;border-collapse:collapse;margin-bottom:20px">
            """.formatted(color, heading, intro));
        for (String[] row : rows) {
            sb.append("""
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);
                              color:#9090b0;font-size:13px;width:40%%">%s</td>
                  <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);
                              color:#e0e0ff;font-size:13px;font-weight:600">%s</td>
                </tr>""".formatted(row[0], row[1]));
        }
        sb.append("""
                </table>
                <p style="color:#9090b0;font-size:13px;line-height:1.6">%s</p>
              </div>
              <div style="background:rgba(255,255,255,0.03);padding:14px;
                          text-align:center;border-top:1px solid rgba(255,255,255,0.06)">
                <p style="color:#9090b0;font-size:12px;margin:0">
                  © 2024 New Dawn Foundation Trust • Secured with BCrypt & JWT
                </p>
              </div>
            </div>""".formatted(footer));
        return sb.toString();
    }

    private static String[] entry(String k, String v) { return new String[]{k, v}; }

    @Async
    public void sendDonationConfirmation(String to, String name, String campaign,
                                          java.math.BigDecimal amount, String receiptNo) {
        String subject = "Donation Confirmed — Thank You!";
        String body = template("Thank You for Your Donation! 🎉",
                "Your generous donation has been received, <strong>" + name + "</strong>.",
                new String[][]{
                    entry("Campaign",    campaign),
                    entry("Amount",      "₹" + amount.toPlainString()),
                    entry("Receipt No.", receiptNo),
                    entry("80G",         "✅ Tax Exempt")
                },
                "Log in to download your tax receipt. Together we make the world better! 💜",
                "#6c3ce8");
        sendHtml(to, subject, body);
    }

    private void sendHtml(String to, String subject, String htmlBody) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            // Use display name "New Dawn Foundation Trust" in the From field
            try {
                helper.setFrom(
                    new jakarta.mail.internet.InternetAddress(
                        "newdawnfoundationtrust@gmail.com",
                        "New Dawn Foundation Trust"
                    )
                );
            } catch (Exception e) {
                helper.setFrom(from);
            }
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(msg);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
