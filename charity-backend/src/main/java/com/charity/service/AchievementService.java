package com.charity.service;

import com.charity.entity.*;
import com.charity.repository.AchievementRepository;
import com.charity.repository.DonationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Gamification Service — awards achievements and XP for user actions.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AchievementService {

    private final AchievementRepository achievementRepo;
    private final DonationRepository    donationRepo;

    /** Achievement metadata */
    private static final Map<Achievement.AchievementType, AchievementMeta> META = Map.ofEntries(
        Map.entry(Achievement.AchievementType.FIRST_DONATION,   new AchievementMeta("First Donation! 🌟",       "Made your very first donation",                 "🌟", "#a78bfa", 100)),
        Map.entry(Achievement.AchievementType.FIVE_DONATIONS,   new AchievementMeta("5 Donations! 🎖️",         "Donated to 5 different campaigns",              "🎖️", "#34d399", 250)),
        Map.entry(Achievement.AchievementType.TEN_DONATIONS,    new AchievementMeta("10 Donations! 🏆",         "Donated to 10 campaigns — true champion!",      "🏆", "#fbbf24", 500)),
        Map.entry(Achievement.AchievementType.AMOUNT_1000,      new AchievementMeta("₹1000 Donated! 💰",       "Total donations crossed ₹1,000",                "💰", "#60a5fa", 150)),
        Map.entry(Achievement.AchievementType.AMOUNT_5000,      new AchievementMeta("₹5000 Hero! 🦸",          "Total donations crossed ₹5,000",                "🦸", "#f59e0b", 400)),
        Map.entry(Achievement.AchievementType.AMOUNT_10000,     new AchievementMeta("₹10000 Legend! 👑",       "Total donations crossed ₹10,000 — legendary!",  "👑", "#ef4444", 800)),
        Map.entry(Achievement.AchievementType.CAMPAIGN_SHARED,  new AchievementMeta("Campaign Shared! 📣",      "Shared a campaign to spread awareness",          "📣", "#ec4899", 50)),
        Map.entry(Achievement.AchievementType.MONTHLY_HERO,     new AchievementMeta("Monthly Hero! ⭐",          "Set up monthly recurring donations",             "⭐", "#06b6d4", 300)),
        Map.entry(Achievement.AchievementType.VOLUNTEER_JOINED, new AchievementMeta("Volunteer! 🤝",            "Registered as a volunteer",                      "🤝", "#10b981", 200)),
        Map.entry(Achievement.AchievementType.EARLY_ADOPTER,    new AchievementMeta("Early Adopter! 🚀",        "Among the first 100 users on the platform",      "🚀", "#7c3aed", 150)),
        Map.entry(Achievement.AchievementType.CONSISTENT_DONOR, new AchievementMeta("Consistent Donor! 🔄",     "Donated in 3 consecutive months",               "🔄", "#d97706", 350))
    );

    /**
     * Called after every successful donation to check/award achievements.
     * Returns list of newly awarded achievements.
     */
    public List<Achievement> checkAndAwardAfterDonation(User user) {
        List<Achievement> newAchievements = new ArrayList<>();

        // Count completed donations
        List<Donation> donations = donationRepo.findByUserUserId(user.getUserId());
        long completedCount = donations.stream()
                .filter(d -> d.getStatus() == Donation.DonationStatus.COMPLETED ||
                             d.getStatus() == Donation.DonationStatus.SUCCESS)
                .count();

        BigDecimal totalAmount = donations.stream()
                .filter(d -> d.getStatus() == Donation.DonationStatus.COMPLETED ||
                             d.getStatus() == Donation.DonationStatus.SUCCESS)
                .map(Donation::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Check count-based achievements
        if (completedCount >= 1)  tryAward(user, Achievement.AchievementType.FIRST_DONATION, newAchievements);
        if (completedCount >= 5)  tryAward(user, Achievement.AchievementType.FIVE_DONATIONS,  newAchievements);
        if (completedCount >= 10) tryAward(user, Achievement.AchievementType.TEN_DONATIONS,   newAchievements);

        // Check amount-based achievements
        if (totalAmount.compareTo(new BigDecimal("1000"))  >= 0) tryAward(user, Achievement.AchievementType.AMOUNT_1000,  newAchievements);
        if (totalAmount.compareTo(new BigDecimal("5000"))  >= 0) tryAward(user, Achievement.AchievementType.AMOUNT_5000,  newAchievements);
        if (totalAmount.compareTo(new BigDecimal("10000")) >= 0) tryAward(user, Achievement.AchievementType.AMOUNT_10000, newAchievements);

        return newAchievements;
    }

    public Achievement awardShareCampaign(User user) {
        List<Achievement> list = new ArrayList<>();
        tryAward(user, Achievement.AchievementType.CAMPAIGN_SHARED, list);
        return list.isEmpty() ? null : list.get(0);
    }

    public Achievement awardMonthlyHero(User user) {
        List<Achievement> list = new ArrayList<>();
        tryAward(user, Achievement.AchievementType.MONTHLY_HERO, list);
        return list.isEmpty() ? null : list.get(0);
    }

    public Achievement awardVolunteer(User user) {
        List<Achievement> list = new ArrayList<>();
        tryAward(user, Achievement.AchievementType.VOLUNTEER_JOINED, list);
        return list.isEmpty() ? null : list.get(0);
    }

    public List<Achievement> getUserAchievements(String userId) {
        return achievementRepo.findByUserUserIdOrderByEarnedAtDesc(userId);
    }

    public int getUserXP(String userId) {
        return achievementRepo.findByUserUserIdOrderByEarnedAtDesc(userId)
                .stream()
                .mapToInt(a -> {
                    AchievementMeta meta = META.get(a.getType());
                    return meta != null ? meta.xp : 0;
                })
                .sum();
    }

    public String getUserLevel(int xp) {
        if (xp >= 2000) return "Legend";
        if (xp >= 1000) return "Champion";
        if (xp >= 500)  return "Hero";
        if (xp >= 200)  return "Supporter";
        if (xp >= 50)   return "Starter";
        return "Newcomer";
    }

    /** Leaderboard: top donors by total donation amount */
    public List<Map<String, Object>> getLeaderboard() {
        List<Donation> allDonations = donationRepo.findAll();

        Map<String, BigDecimal> totals = new HashMap<>();
        Map<String, String>     names  = new HashMap<>();

        for (Donation d : allDonations) {
            if ((d.getStatus() != Donation.DonationStatus.COMPLETED &&
                 d.getStatus() != Donation.DonationStatus.SUCCESS) || Boolean.TRUE.equals(d.getAnonymous())) continue;
            if (d.getUser() == null) continue;
            String uid = d.getUser().getUserId();
            totals.merge(uid, d.getAmount(), BigDecimal::add);
            names.put(uid, d.getUser().getFullName());
        }

        return totals.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .limit(20)
                .map(e -> {
                    String uid = e.getKey();
                    int xp = getUserXP(uid);
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("userId", uid);
                    row.put("name", names.getOrDefault(uid, "Anonymous"));
                    row.put("totalDonated", e.getValue());
                    row.put("xp", xp);
                    row.put("level", getUserLevel(xp));
                    row.put("achievementCount", achievementRepo.countByUserUserId(uid));
                    return row;
                })
                .collect(Collectors.toList());
    }

    // ── Private Helpers ────────────────────────────────────────

    private void tryAward(User user, Achievement.AchievementType type, List<Achievement> newList) {
        if (achievementRepo.existsByUserUserIdAndType(user.getUserId(), type)) return;
        AchievementMeta meta = META.get(type);
        if (meta == null) return;

        Achievement a = Achievement.builder()
                .user(user)
                .type(type)
                .title(meta.title)
                .description(meta.description)
                .badgeEmoji(meta.emoji)
                .badgeColor(meta.color)
                .xpAwarded(meta.xp)
                .build();

        newList.add(achievementRepo.save(a));
        log.info("Achievement awarded: {} to user {}", type, user.getUserId());
    }

    record AchievementMeta(String title, String description, String emoji, String color, int xp) {}
}
