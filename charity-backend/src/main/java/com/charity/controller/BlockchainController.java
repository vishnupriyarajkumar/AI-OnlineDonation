package com.charity.controller;

import com.charity.dto.ApiResponse;
import com.charity.entity.BlockchainTransaction;
import com.charity.service.BlockchainService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.charity.repository.UserRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BlockchainController {

    private final BlockchainService blockchainService;
    private final UserRepository    userRepository;

    /** Verify a transaction hash (public) */
    @GetMapping("/blockchain/verify/{txHash}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verify(@PathVariable String txHash) {
        boolean valid = blockchainService.verifyTransaction(txHash);
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "txHash", txHash,
                "verified", valid,
                "network", "CharityChain-Testnet"
        )));
    }

    /** Get all blockchain transactions for current user */
    @GetMapping("/user/blockchain")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<List<BlockchainTransaction>>> myTransactions(
            @AuthenticationPrincipal UserDetails ud) {
        var user = userRepository.findByEmail(ud.getUsername())
                .or(() -> userRepository.findByPhone(ud.getUsername()))
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(ApiResponse.ok(
                blockchainService.getUserTransactions(user.getUserId())));
    }

    /** Get blockchain transactions for a campaign (public) */
    @GetMapping("/blockchain/campaign/{campaignId}")
    public ResponseEntity<ApiResponse<List<BlockchainTransaction>>> campaignTransactions(
            @PathVariable String campaignId) {
        return ResponseEntity.ok(ApiResponse.ok(
                blockchainService.getCampaignTransactions(campaignId)));
    }

    /** Admin: all blockchain transactions */
    @GetMapping("/admin/blockchain")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<BlockchainTransaction>>> allTransactions() {
        return ResponseEntity.ok(ApiResponse.ok(blockchainService.getAllTransactions()));
    }

    /** Get blockchain record for a specific donation */
    @GetMapping("/blockchain/donation/{donationId}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<BlockchainTransaction>> byDonation(
            @PathVariable String donationId) {
        return ResponseEntity.ok(ApiResponse.ok(
                blockchainService.getByDonationId(donationId).orElse(null)));
    }
}
