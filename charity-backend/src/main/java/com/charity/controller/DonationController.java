package com.charity.controller;

import com.charity.dto.ApiResponse;
import com.charity.dto.donation.*;
import com.charity.service.DonationService;
import com.charity.service.PaymentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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
@Tag(name = "Donations", description = "Donation flow and payment")
public class DonationController {

    private final DonationService donationService;
    private final PaymentService paymentService;

    @PostMapping("/user/donations")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<DonationResponse>> initiateDonation(
            @Valid @RequestBody DonationRequest req,
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok("Donation initiated",
                donationService.createDonation(req, ud.getUsername())));
    }

    @PostMapping("/user/donations/{donationId}/order")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createOrder(
            @PathVariable Long donationId) throws Exception {
        return ResponseEntity.ok(ApiResponse.ok("Razorpay order created",
                paymentService.createOrder(donationId)));
    }

    @PostMapping("/user/donations/{donationId}/verify")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<DonationResponse>> verifyPayment(
            @PathVariable Long donationId,
            @RequestParam String razorpayOrderId,
            @RequestParam String razorpayPaymentId,
            @RequestParam String razorpaySignature) throws Exception {
        paymentService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature, donationId);
        DonationResponse resp = donationService.confirmDonation(donationId, razorpayPaymentId);
        return ResponseEntity.ok(ApiResponse.ok("Payment verified. Thank you!", resp));
    }

    @GetMapping("/user/donations/my")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ApiResponse<List<DonationResponse>>> myDonations(
            @AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(ApiResponse.ok(donationService.getMyDonations(ud.getUsername())));
    }

    @GetMapping("/admin/donations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<DonationResponse>>> allDonations() {
        return ResponseEntity.ok(ApiResponse.ok(donationService.getAllDonations()));
    }
}
