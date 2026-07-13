package com.charity.controller;

import com.charity.dto.ApiResponse;
import com.charity.dto.campaign.*;
import com.charity.service.CampaignService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Campaigns", description = "Campaign CRUD and approval")
public class CampaignController {

    private final CampaignService campaignService;

    /* ── Public endpoints ─────────────────────────────── */

    @GetMapping("/campaigns/public")
    @Operation(summary = "Get all active campaigns (public)")
    public ResponseEntity<ApiResponse<List<CampaignResponse>>> publicCampaigns() {
        return ResponseEntity.ok(ApiResponse.ok(campaignService.getActiveCampaigns()));
    }

    @GetMapping("/campaigns/public/{id}")
    @Operation(summary = "Get campaign by ID (public)")
    public ResponseEntity<ApiResponse<CampaignResponse>> publicCampaignById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(campaignService.getById(id)));
    }

    /* ── Admin endpoints ──────────────────────────────── */

    @GetMapping("/admin/campaigns")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CampaignResponse>>> allCampaigns() {
        return ResponseEntity.ok(ApiResponse.ok(campaignService.getAllCampaigns()));
    }

    @PutMapping("/admin/campaigns/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve a pending campaign")
    public ResponseEntity<ApiResponse<CampaignResponse>> approve(@PathVariable String id,
                                                                   @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok("Campaign approved", campaignService.approve(id, ud.getUsername())));
    }

    @DeleteMapping("/admin/campaigns/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCampaign(@PathVariable String id,
                                                             @AuthenticationPrincipal UserDetails ud) {
        campaignService.delete(id, ud.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Campaign deleted", null));
    }

    @PostMapping("/admin/campaigns")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new campaign")
    public ResponseEntity<ApiResponse<CampaignResponse>> create(@Valid @RequestBody CampaignRequest req,
                                                                  @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok("Campaign created", campaignService.create(req, ud.getUsername())));
    }

    @PutMapping("/admin/campaigns/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update campaign")
    public ResponseEntity<ApiResponse<CampaignResponse>> update(@PathVariable String id,
                                                                  @Valid @RequestBody CampaignRequest req,
                                                                  @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok("Campaign updated", campaignService.update(id, req, ud.getUsername())));
    }

    /* ── User endpoint ───────────────────────────────── */

    @GetMapping("/user/campaigns")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    @Operation(summary = "Get active campaigns for users")
    public ResponseEntity<ApiResponse<List<CampaignResponse>>> userCampaigns() {
        return ResponseEntity.ok(ApiResponse.ok(campaignService.getActiveCampaigns()));
    }
}
