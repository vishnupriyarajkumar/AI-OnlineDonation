package com.charity.service;

import com.charity.entity.*;
import com.charity.repository.*;
import com.razorpay.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final DonationRepository donationRepository;
    private final TransactionRepository transactionRepository;
    private final DonationService donationService;

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    public Map<String, Object> createOrder(Long donationId) throws Exception {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new RuntimeException("Donation not found"));

        if (keyId.contains("XXX")) {
            Transaction txn = Transaction.builder()
                    .donation(donation)
                    .razorpayOrderId("mock_order_" + System.currentTimeMillis())
                    .amount(donation.getAmount())
                    .status(Transaction.TxnStatus.CREATED)
                    .build();
            transactionRepository.save(txn);
            return Map.of(
                "orderId", txn.getRazorpayOrderId(),
                "amount",  donation.getAmount().multiply(BigDecimal.valueOf(100)).intValue(),
                "currency","INR",
                "keyId",   keyId,
                "donationId", donationId
            );
        }

        RazorpayClient client = new RazorpayClient(keyId, keySecret);
        JSONObject options = new JSONObject();
        // Razorpay expects amount in paise (₹1 = 100 paise)
        options.put("amount", donation.getAmount().multiply(BigDecimal.valueOf(100)).intValue());
        options.put("currency", "INR");
        options.put("receipt", "RCPT_" + donationId);

        Order order = client.orders.create(options);

        Transaction txn = Transaction.builder()
                .donation(donation)
                .razorpayOrderId(order.get("id"))
                .amount(donation.getAmount())
                .status(Transaction.TxnStatus.CREATED)
                .build();
        transactionRepository.save(txn);

        return Map.of(
            "orderId", order.get("id").toString(),
            "amount",  donation.getAmount().multiply(BigDecimal.valueOf(100)).intValue(),
            "currency","INR",
            "keyId",   keyId,
            "donationId", donationId
        );
    }

    public com.charity.dto.donation.DonationResponse verifyPayment(String orderId, String paymentId,
                                                         String signature, Long donationId) throws Exception {
        if (keySecret.contains("XXX")) {
            Transaction txn = transactionRepository.findByRazorpayOrderId(orderId)
                    .orElseThrow(() -> new RuntimeException("Transaction not found"));
            txn.setRazorpayPaymentId(paymentId);
            txn.setRazorpaySignature(signature);
            txn.setStatus(Transaction.TxnStatus.CAPTURED);
            transactionRepository.save(txn);
            return null;
        }

        String data = orderId + "|" + paymentId;
        String generatedSig = hmacSHA256(data, keySecret);

        if (!generatedSig.equals(signature)) {
            throw new RuntimeException("Payment signature verification failed");
        }

        Transaction txn = transactionRepository.findByRazorpayOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        txn.setRazorpayPaymentId(paymentId);
        txn.setRazorpaySignature(signature);
        txn.setStatus(Transaction.TxnStatus.CAPTURED);
        transactionRepository.save(txn);

        return null; // donation confirmation handled separately
    }

    private String hmacSHA256(String data, String secret) throws Exception {
        Mac sha256 = Mac.getInstance("HmacSHA256");
        sha256.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hash = sha256.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
