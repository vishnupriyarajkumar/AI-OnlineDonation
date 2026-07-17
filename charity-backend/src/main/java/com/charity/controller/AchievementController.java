package com.charity.controller;

import com.charity.dto.ApiResponse;
import com.charity.entity.Achievement;
import com.charity.service.AchievementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;

    /** Get current user's achievements */
    @GetMapping("/user/achievements")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<List<Achievement>>> myAchievements(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(
                achievementService.getUserAchievements(ud.getUsername())));
    }

    /** Get current user's XP and level */
    @GetMapping("/user/achievements/stats")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> myStats(
            @AuthenticationPrincipal UserDetails ud) {
        int xp = achievementService.getUserXP(ud.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "xp", xp,
                "level", achievementService.getUserLevel(xp),
                "achievementCount", achievementService.getUserAchievements(ud.getUsername()).size()
        )));
    }

    /** Global leaderboard */
    @GetMapping("/leaderboard")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> leaderboard() {
        return ResponseEntity.ok(ApiResponse.ok(achievementService.getLeaderboard()));
    }

    /** Award share campaign achievement */
    @PostMapping("/user/achievements/share")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<Achievement>> awardShare(
            @AuthenticationPrincipal UserDetails ud,
            com.charity.repository.UserRepository userRepo) {
        var user = userRepo.findByEmail(ud.getUsername())
                .or(() -> userRepo.findByPhone(ud.getUsername()))
                .orElseThrow(() -> new RuntimeException("User not found"));
        Achievement a = achievementService.awardShareCampaign(user);
        return ResponseEntity.ok(ApiResponse.ok(a));
    }
}
