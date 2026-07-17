package com.charity.config;

import com.charity.entity.*;
import com.charity.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Auto-seeds the database with roles, admin user, sample users, and campaigns
 * on every application startup. Uses INSERT-IF-NOT-EXISTS logic so it is safe
 * to run repeatedly without duplicating data.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository         roleRepository;
    private final UserRepository         userRepository;
    private final CampaignRepository     campaignRepository;
    private final DonationRepository     donationRepository;
    private final ReceiptRepository      receiptRepository;
    private final AuditLogRepository     auditLogRepository;
    private final UserActivityRepository userActivityRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder        passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedRoles();
        seedAdminUser();
        seedSampleUsers();
        seedSubscriptionsForExistingUsers();
        seedCampaigns();
        seedSampleDonations();
        seedSampleAuditLogs();
        seedSampleUserActivities();
        log.info("✅ Data initialization complete.");
    }

    private void seedRoles() {
        if (roleRepository.findByRoleName(Role.RoleName.ADMIN).isEmpty()) {
            roleRepository.save(Role.builder().roleName(Role.RoleName.ADMIN).build());
            log.info("Created ADMIN role");
        }
        if (roleRepository.findByRoleName(Role.RoleName.USER).isEmpty()) {
            roleRepository.save(Role.builder().roleName(Role.RoleName.USER).build());
            log.info("Created USER role");
        }
        if (roleRepository.findByRoleName(Role.RoleName.NGO).isEmpty()) {
            roleRepository.save(Role.builder().roleName(Role.RoleName.NGO).build());
            log.info("Created NGO role");
        }
    }

    private void seedAdminUser() {
        String newEmail    = "newdawnfoundationtrust@gmail.com";
        String newPassword = "Admin@1234";
        String oldEmail    = "admin@charityorg.com";

        // If new email already exists, just re-sync password
        if (userRepository.findByEmail(newEmail).isPresent()) {
            User admin = userRepository.findByEmail(newEmail).get();
            admin.setPassword(passwordEncoder.encode(newPassword));
            admin.setFullName("New Dawn Foundation Trust");
            admin.setIsVerified(true);
            userRepository.save(admin);
            log.info("✅ Admin password re-synced for {}", newEmail);
            return;
        }

        // If old email exists, UPDATE it in place (avoids FK constraint issues)
        if (userRepository.findByEmail(oldEmail).isPresent()) {
            User admin = userRepository.findByEmail(oldEmail).get();
            admin.setEmail(newEmail);
            admin.setFullName("New Dawn Foundation Trust");
            admin.setPassword(passwordEncoder.encode(newPassword));
            admin.setIsVerified(true);
            userRepository.save(admin);
            log.info("✅ Admin email migrated: {} → {}", oldEmail, newEmail);
            return;
        }

        // Fresh install — create new admin
        Role adminRole = roleRepository.findByRoleName(Role.RoleName.ADMIN).orElseThrow();
        User admin = User.builder()
                .fullName("New Dawn Foundation Trust")
                .email(newEmail)
                .password(passwordEncoder.encode(newPassword))
                .phone("+919876543210")
                .role(adminRole)
                .isVerified(true)
                .enabled(true)
                .locked(false)
                .failedLoginAttempts(0)
                .build();
        userRepository.save(admin);
        log.info("✅ Admin user created: {}", newEmail);
    }

    private void seedSampleUsers() {
        Role userRole = roleRepository.findByRoleName(Role.RoleName.USER).orElseThrow();
        Role ngoRole  = roleRepository.findByRoleName(Role.RoleName.NGO).orElseThrow();
        String encodedPwd = passwordEncoder.encode("User@1234");

        createUserIfMissing("Riya Sharma",   "riya@example.com",           "+919876500001", userRole, encodedPwd);
        createUserIfMissing("Arjun Mehta",   "arjun@example.com",          "+919876500002", userRole, encodedPwd);
        createUserIfMissing("Priya Patel",   "priya@example.com",          "+919876500003", userRole, encodedPwd);
        // Demo user from spec
        createUserIfMissing("Vicky Demo",    "mrvicks67@gmail.com",         "+919876500004", userRole, encodedPwd);
        // Additional test users
        createUserIfMissing("Vishnu Priya",  "vishnupriyarajkumar7@gmail.com", "+919944586029", userRole,
                passwordEncoder.encode("Vish123@1234"));
        // Sample NGO organizations
        createUserIfMissing("Smile Foundation NGO", "smilefoundation@ngo.org", "+919876500010", ngoRole,
                passwordEncoder.encode("Ngo@1234"));
        createUserIfMissing("CRY India NGO",        "cry@ngo.org",            "+919876500011", ngoRole,
                passwordEncoder.encode("Ngo@1234"));
    }

    private void createUserIfMissing(String name, String email, String phone, Role role, String pwd) {
        if (userRepository.findByEmail(email).isEmpty()) {
            userRepository.save(User.builder()
                    .fullName(name).email(email).password(pwd)
                    .phone(phone).role(role)
                    .isVerified(true)
                    .enabled(true).locked(false)
                    .failedLoginAttempts(0)
                    .build());
            log.info("  Created user: {}", email);
        }
    }

    /**
     * Ensures every verified user has a Subscription row with firstLoginDone=true.
     * This prevents the onboarding redirect loop for seeded/existing users.
     */
    private void seedSubscriptionsForExistingUsers() {
        userRepository.findAll().forEach(user -> {
            if (Boolean.TRUE.equals(user.getIsVerified())) {
                subscriptionRepository.findByUser(user).orElseGet(() -> {
                    Subscription sub = Subscription.builder()
                            .user(user)
                            .donorType(Subscription.DonorType.GENERAL)
                            .status(Subscription.SubscriptionStatus.ACTIVE)
                            .firstLoginDone(true)
                            .build();
                    subscriptionRepository.save(sub);
                    log.info("  Seeded subscription for user: {}", user.getEmail());
                    return sub;
                });
            }
        });
    }

    private void seedCampaigns() {
        if (campaignRepository.count() > 0) return;

        // Find admin by new email, fallback to old email, fallback to any ADMIN role user
        User admin = userRepository.findByEmail("newdawnfoundationtrust@gmail.com")
                .or(() -> userRepository.findByEmail("admin@charityorg.com"))
                .or(() -> userRepository.findAll().stream()
                        .filter(u -> u.getRole() != null &&
                                     u.getRole().getRoleName() == Role.RoleName.ADMIN)
                        .findFirst())
                .orElseThrow(() -> new RuntimeException("No admin user found for campaign seeding"));

        campaignRepository.save(Campaign.builder()
                .campaignName("Clean Water for Rural Villages")
                .description("Providing safe drinking water to 500 families in remote Maharashtra villages through deep tube wells and solar pumps.")
                .goalAmount(new BigDecimal("500000"))
                .collectedAmount(new BigDecimal("450000"))
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(30))
                .imageUrl("https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600")
                .category("Water").beneficiaries(500)
                .urgencyLevel(Campaign.UrgencyLevel.CRITICAL)
                .status(Campaign.CampaignStatus.ACTIVE)
                .createdBy(admin)
                .build());

        campaignRepository.save(Campaign.builder()
                .campaignName("Education for Every Child")
                .description("Sponsoring school kits, uniforms, and tuition fees for 200 underprivileged children to ensure zero dropout rates.")
                .goalAmount(new BigDecimal("300000"))
                .collectedAmount(new BigDecimal("120000"))
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(60))
                .imageUrl("https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600")
                .category("Education").beneficiaries(200)
                .urgencyLevel(Campaign.UrgencyLevel.HIGH)
                .status(Campaign.CampaignStatus.ACTIVE)
                .createdBy(admin)
                .build());

        campaignRepository.save(Campaign.builder()
                .campaignName("Free Medical Camp for Elderly")
                .description("Free checkups, medicines, cataract surgeries, and diabetes management for 300 senior citizens in rural areas.")
                .goalAmount(new BigDecimal("100000"))
                .collectedAmount(new BigDecimal("85000"))
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(14))
                .imageUrl("https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600")
                .category("Healthcare").beneficiaries(300)
                .urgencyLevel(Campaign.UrgencyLevel.MEDIUM)
                .status(Campaign.CampaignStatus.ACTIVE)
                .createdBy(admin)
                .build());

        campaignRepository.save(Campaign.builder()
                .campaignName("Flood Relief — Emergency Aid")
                .description("Emergency food packets, shelter kits, and medical supplies for 2500 flood-affected families in Assam.")
                .goalAmount(new BigDecimal("1000000"))
                .collectedAmount(new BigDecimal("750000"))
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(10))
                .imageUrl("https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=600")
                .category("Food").beneficiaries(2500)
                .urgencyLevel(Campaign.UrgencyLevel.CRITICAL)
                .status(Campaign.CampaignStatus.ACTIVE)
                .createdBy(admin)
                .build());

        campaignRepository.save(Campaign.builder()
                .campaignName("Plant a Million Trees")
                .description("Community-driven reforestation initiative across 5 districts of Karnataka to combat deforestation.")
                .goalAmount(new BigDecimal("200000"))
                .collectedAmount(new BigDecimal("60000"))
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(90))
                .imageUrl("https://images.unsplash.com/photo-1448375240586-882707db888b?w=600")
                .category("Environment").beneficiaries(10000)
                .urgencyLevel(Campaign.UrgencyLevel.LOW)
                .status(Campaign.CampaignStatus.ACTIVE)
                .createdBy(admin)
                .build());

        log.info("✅ 5 sample campaigns created");
    }

    // ── Seed sample donations so Reports & Donations pages show real data ──

    private void seedSampleDonations() {
        if (donationRepository.count() > 0) return;

        // Get users and campaigns
        User riya  = userRepository.findByEmail("riya@example.com").orElse(null);
        User arjun = userRepository.findByEmail("arjun@example.com").orElse(null);
        User priya = userRepository.findByEmail("priya@example.com").orElse(null);
        User vicky = userRepository.findByEmail("mrvicks67@gmail.com").orElse(null);
        if (riya == null || arjun == null) return;

        var campaigns = campaignRepository.findAll();
        if (campaigns.isEmpty()) return;
        Campaign c1 = campaigns.get(0);
        Campaign c2 = campaigns.size() > 1 ? campaigns.get(1) : c1;
        Campaign c3 = campaigns.size() > 2 ? campaigns.get(2) : c1;
        Campaign c4 = campaigns.size() > 3 ? campaigns.get(3) : c1;

        // Create sample donations across past months
        LocalDateTime now = LocalDateTime.now();
        Object[][] data = {
            {riya,  c1, "5000",  Donation.PaymentMethod.UPI,         Donation.DonationStatus.SUCCESS, now.minusMonths(5).minusDays(3),  false},
            {arjun, c2, "2500",  Donation.PaymentMethod.CREDIT_CARD, Donation.DonationStatus.SUCCESS, now.minusMonths(4).minusDays(10), false},
            {priya, c3, "10000", Donation.PaymentMethod.NET_BANKING,  Donation.DonationStatus.SUCCESS, now.minusMonths(4).minusDays(2),  false},
            {vicky, c1, "1000",  Donation.PaymentMethod.UPI,         Donation.DonationStatus.SUCCESS, now.minusMonths(3).minusDays(15), false},
            {riya,  c4, "7500",  Donation.PaymentMethod.DEBIT_CARD,  Donation.DonationStatus.SUCCESS, now.minusMonths(3).minusDays(5),  false},
            {arjun, c3, "3000",  Donation.PaymentMethod.UPI,         Donation.DonationStatus.SUCCESS, now.minusMonths(2).minusDays(20), false},
            {priya, c2, "5000",  Donation.PaymentMethod.CREDIT_CARD, Donation.DonationStatus.SUCCESS, now.minusMonths(2).minusDays(8),  false},
            {vicky, c4, "2000",  Donation.PaymentMethod.UPI,         Donation.DonationStatus.SUCCESS, now.minusMonths(1).minusDays(12), false},
            {riya,  c1, "8000",  Donation.PaymentMethod.NET_BANKING,  Donation.DonationStatus.SUCCESS, now.minusMonths(1).minusDays(4),  false},
            {arjun, c2, "1500",  Donation.PaymentMethod.UPI,         Donation.DonationStatus.SUCCESS, now.minusDays(18),               false},
            {priya, c3, "4000",  Donation.PaymentMethod.CREDIT_CARD, Donation.DonationStatus.SUCCESS, now.minusDays(9),                true },
            {vicky, c1, "6000",  Donation.PaymentMethod.DEBIT_CARD,  Donation.DonationStatus.SUCCESS, now.minusDays(3),                false},
            {riya,  c4, "500",   Donation.PaymentMethod.UPI,         Donation.DonationStatus.PENDING, now.minusDays(1),                false},
        };

        int receiptSeq = 1;
        for (Object[] row : data) {
            User user    = (User)   row[0];
            Campaign cam = (Campaign) row[1];
            BigDecimal amt = new BigDecimal((String) row[2]);
            Donation.PaymentMethod pm = (Donation.PaymentMethod) row[3];
            Donation.DonationStatus st = (Donation.DonationStatus) row[4];
            LocalDateTime dt = (LocalDateTime) row[5];
            boolean anon = (boolean) row[6];

            Donation donation = Donation.builder()
                    .user(user).campaign(cam)
                    .amount(amt).paymentMethod(pm)
                    .status(st).anonymous(anon)
                    .transactionId(st == Donation.DonationStatus.SUCCESS
                            ? "TXN" + dt.format(DateTimeFormatter.ofPattern("yyyyMMdd")) + receiptSeq
                            : null)
                    .build();
            // Override auto-generated donationDate by saving manually after creation
            donation = donationRepository.save(donation);

            // Update campaign collected amount
            cam.setCollectedAmount(cam.getCollectedAmount().add(
                    st == Donation.DonationStatus.SUCCESS ? amt : BigDecimal.ZERO));
            campaignRepository.save(cam);

            // Generate receipt for successful donations
            if (st == Donation.DonationStatus.SUCCESS) {
                String receiptNo = "RCP-" + dt.format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                        + "-" + String.format("%06d", receiptSeq++);
                receiptRepository.save(Receipt.builder()
                        .donation(donation)
                        .receiptNumber(receiptNo)
                        .build());
            }
        }
        log.info("✅ {} sample donations seeded", data.length);
    }

    // ── Seed sample audit logs so AuditLogs page shows real data ──

    private void seedSampleAuditLogs() {
        if (auditLogRepository.count() > 0) return;

        User riya   = userRepository.findByEmail("riya@example.com").orElse(null);
        User arjun  = userRepository.findByEmail("arjun@example.com").orElse(null);
        User priya  = userRepository.findByEmail("priya@example.com").orElse(null);
        User admin  = userRepository.findByEmail("newdawnfoundationtrust@gmail.com").orElse(null);
        if (riya == null || admin == null) return;

        LocalDateTime now = LocalDateTime.now();
        Object[][] logs = {
            {admin, "LOGIN_SUCCESS",    "User", admin.getUserId(), "127.0.0.1",     "Login successful. Role: ADMIN",             now.minusDays(1).minusHours(2)},
            {riya,  "USER_REGISTERED",  "User", riya.getUserId(),  "192.168.1.5",   "Account created via email",                 now.minusDays(10)},
            {riya,  "ACCOUNT_VERIFIED", "User", riya.getUserId(),  "192.168.1.5",   "Email verified, account activated",         now.minusDays(10).plusMinutes(5)},
            {riya,  "LOGIN_SUCCESS",    "User", riya.getUserId(),  "192.168.1.5",   "Login successful",                          now.minusDays(3)},
            {arjun, "USER_REGISTERED",  "User", arjun.getUserId(), "10.0.0.3",      "Account created via email",                 now.minusDays(8)},
            {arjun, "LOGIN_SUCCESS",    "User", arjun.getUserId(), "10.0.0.3",      "Login successful",                          now.minusDays(2)},
            {arjun, "DONATION_INITIATED","Campaign", "1",           "10.0.0.3",      "Amount: ₹2500",                             now.minusDays(2).plusHours(1)},
            {priya, "USER_REGISTERED",  "User", priya.getUserId(), "10.0.0.9",      "Account created via email",                 now.minusDays(6)},
            {priya, "LOGIN_FAILED",     "User", priya.getUserId(), "10.0.0.9",      "Failed password attempt #1",                now.minusDays(5)},
            {priya, "LOGIN_SUCCESS",    "User", priya.getUserId(), "10.0.0.9",      "Login successful",                          now.minusDays(4)},
            {admin, "CAMPAIGN_CREATED", "Campaign", "1",            "127.0.0.1",     "Clean Water for Rural Villages",            now.minusDays(15)},
            {admin, "CAMPAIGN_CREATED", "Campaign", "2",            "127.0.0.1",     "Education for Every Child",                 now.minusDays(15)},
            {admin, "LOGIN_SUCCESS",    "User", admin.getUserId(), "127.0.0.1",     "Login successful. Role: ADMIN",             now.minusHours(3)},
        };

        for (Object[] entry : logs) {
            auditLogRepository.save(AuditLog.builder()
                    .user((User) entry[0])
                    .action((String) entry[1])
                    .entityType((String) entry[2])
                    .entityId(entry[3] != null ? entry[3].toString() : null)
                    .ipAddress((String) entry[4])
                    .details((String) entry[5])
                    .build());
        }
        log.info("✅ {} sample audit log entries seeded", logs.length);
    }

    // ── Seed UserActivity records for Activity Monitor ──

    private void seedSampleUserActivities() {
        if (userActivityRepository.count() > 0) return;

        User riya  = userRepository.findByEmail("riya@example.com").orElse(null);
        User arjun = userRepository.findByEmail("arjun@example.com").orElse(null);
        User priya = userRepository.findByEmail("priya@example.com").orElse(null);
        User vicky = userRepository.findByEmail("mrvicks67@gmail.com").orElse(null);
        User admin = userRepository.findByEmail("newdawnfoundationtrust@gmail.com").orElse(null);
        if (riya == null || admin == null) return;

        LocalDateTime now = LocalDateTime.now();

        Object[][] activities = {
            {admin, UserActivity.ActivityType.LOGGED_IN,          "Login successful. Role: ADMIN",                "127.0.0.1",    now.minusDays(1).minusHours(2)},
            {riya,  UserActivity.ActivityType.REGISTERED,          "Account created via email",                   "192.168.1.5",  now.minusDays(10)},
            {riya,  UserActivity.ActivityType.EMAIL_VERIFIED,      "Email verified, account activated",           "192.168.1.5",  now.minusDays(10).plusMinutes(5)},
            {riya,  UserActivity.ActivityType.LOGGED_IN,           "Login successful",                            "192.168.1.5",  now.minusDays(3)},
            {riya,  UserActivity.ActivityType.DONATION_COMPLETED,  "Donated ₹5000 to Clean Water campaign",       "192.168.1.5",  now.minusDays(3).plusHours(1)},
            {arjun, UserActivity.ActivityType.REGISTERED,          "Account created via email",                   "10.0.0.3",     now.minusDays(8)},
            {arjun, UserActivity.ActivityType.LOGGED_IN,           "Login successful",                            "10.0.0.3",     now.minusDays(2)},
            {arjun, UserActivity.ActivityType.DONATION_INITIATED,  "Donation ₹2500 initiated",                    "10.0.0.3",     now.minusDays(2).plusHours(1)},
            {arjun, UserActivity.ActivityType.DONATION_COMPLETED,  "Donated ₹2500 to Education campaign",         "10.0.0.3",     now.minusDays(2).plusHours(2)},
            {priya, UserActivity.ActivityType.REGISTERED,          "Account created via email",                   "10.0.0.9",     now.minusDays(6)},
            {priya, UserActivity.ActivityType.LOGIN_FAILED,        "Failed login attempt #1",                     "10.0.0.9",     now.minusDays(5)},
            {priya, UserActivity.ActivityType.LOGGED_IN,           "Login successful",                            "10.0.0.9",     now.minusDays(4)},
            {vicky, UserActivity.ActivityType.LOGGED_IN,           "Login successful",                            "192.168.2.10", now.minusDays(1)},
            {vicky, UserActivity.ActivityType.DONATION_COMPLETED,  "Donated ₹1000 to Flood Relief campaign",      "192.168.2.10", now.minusDays(1).plusHours(1)},
            {admin, UserActivity.ActivityType.CAMPAIGN_CREATED,    "Created: Clean Water for Rural Villages",     "127.0.0.1",    now.minusDays(15)},
            {admin, UserActivity.ActivityType.CAMPAIGN_CREATED,    "Created: Education for Every Child",          "127.0.0.1",    now.minusDays(15).plusMinutes(5)},
            {admin, UserActivity.ActivityType.FUND_ALLOCATED,      "Allocated ₹50000 to Education campaign",      "127.0.0.1",    now.minusDays(2)},
            {admin, UserActivity.ActivityType.LOGGED_IN,           "Login successful. Role: ADMIN",               "127.0.0.1",    now.minusHours(3)},
        };

        for (Object[] row : activities) {
            userActivityRepository.save(UserActivity.builder()
                    .user((User)row[0])
                    .activityType((UserActivity.ActivityType)row[1])
                    .description((String)row[2])
                    .ipAddress((String)row[3])
                    .build());
        }
        log.info("✅ {} sample user activities seeded", activities.length);
    }
}
