package com.charity.service;

import com.charity.entity.OtpVerification;
import com.charity.entity.User;
import com.charity.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * Handles OTP generation, storage, and verification for 2FA.
 *
 * Rules:
 *  - OTP is a cryptographically-random 6-digit code.
 *  - OTP expires after 5 minutes.
 *  - Maximum 3 incorrect verification attempts.
 *  - Resend is blocked for 30 seconds after each send.
 *  - OTP hash is stored using BCrypt (same encoder as passwords).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private static final int    OTP_LENGTH          = 6;
    private static final int    OTP_EXPIRY_MINUTES  = 5;
    private static final int    MAX_ATTEMPTS        = 3;
    private static final int    RESEND_COOLDOWN_SEC = 30;

    private final OtpVerificationRepository otpRepo;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final TwilioSmsService twilioSmsService;

    /**
     * Generates and sends OTP, choosing channel based on useEmail flag.
     * If useEmail=true  → sends to user.email
     * If useEmail=false → sends to user.phone via SMS
     */
    @Transactional
    public OtpVerification generateAndSendToChannel(User user, boolean useEmail) {
        // Check resend cooldown
        otpRepo.findByUser(user).ifPresent(existing -> {
            if (existing.isResendBlocked()) {
                long wait = existing.secondsUntilResendAllowed();
                throw new RuntimeException("Please wait " + wait + " second(s) before requesting a new OTP.");
            }
        });

        String plainOtp  = generateSecureOtp();
        String hashedOtp = passwordEncoder.encode(plainOtp);
        LocalDateTime now = LocalDateTime.now();

        otpRepo.deleteByUser(user);
        // flush() not needed in MongoDB

        OtpVerification record = OtpVerification.builder()
                .user(user).otpHash(hashedOtp)
                .expiryTime(now.plusMinutes(OTP_EXPIRY_MINUTES))
                .lastSentAt(now).attempts(0).verified(false)
                .build();
        otpRepo.save(record);

        if (useEmail && user.getEmail() != null && !user.getEmail().isBlank()) {
            emailService.sendOtp(user.getEmail(), user.getFullName(), plainOtp);
        } else if (user.getPhone() != null && !user.getPhone().isBlank()) {
            twilioSmsService.sendOtpSms(user.getPhone(), plainOtp);
        } else if (user.getEmail() != null && !user.getEmail().isBlank()) {
            emailService.sendOtp(user.getEmail(), user.getFullName(), plainOtp);
        }

        log.info("OTP sent to user {} via {}. Plain OTP (debug): {}", user.getUserId(), useEmail ? "email" : "SMS", plainOtp);
        return record;
    }

    /**
     * Generates and sends OTP specifically for password reset.
     * Clears any previously verified OTP so it can be reused for reset.
     */
    @Transactional
    public OtpVerification generateAndSendForPasswordReset(User user) {
        // For password reset, ignore cooldown on previously verified OTPs
        otpRepo.findByUser(user).ifPresent(existing -> {
            if (!existing.isVerified() && existing.isResendBlocked()) {
                long wait = existing.secondsUntilResendAllowed();
                throw new RuntimeException(
                    "Please wait " + wait + " second(s) before requesting a new code.");
            }
        });

        String plainOtp  = generateSecureOtp();
        String hashedOtp = passwordEncoder.encode(plainOtp);
        LocalDateTime now = LocalDateTime.now();

        // Always delete existing OTP (even if verified) for password reset
        otpRepo.deleteByUser(user);
        // flush() not needed in MongoDB

        OtpVerification otpRecord = OtpVerification.builder()
                .user(user)
                .otpHash(hashedOtp)
                .expiryTime(now.plusMinutes(OTP_EXPIRY_MINUTES))
                .lastSentAt(now)
                .attempts(0)
                .verified(false)
                .build();

        otpRepo.save(otpRecord);

        // Send via email
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            emailService.sendPasswordResetOtp(user.getEmail(), user.getFullName(), plainOtp);
            log.info("Password reset OTP sent to email: {}. Plain OTP (debug): {}", user.getEmail(), plainOtp);
        } else if (user.getPhone() != null && !user.getPhone().isBlank()) {
            twilioSmsService.sendOtpSms(user.getPhone(), plainOtp);
            log.info("Password reset OTP sent via SMS to: {}. Plain OTP (debug): {}", user.getPhone(), plainOtp);
        } else {
            log.warn("No email or phone to send password reset OTP for user {}", user.getUserId());
            throw new RuntimeException("No email or phone associated with this account.");
        }

        return otpRecord;
    }
    @Transactional
    public OtpVerification generateAndSend(User user) {
        // Check resend cooldown
        otpRepo.findByUser(user).ifPresent(existing -> {
            if (existing.isResendBlocked()) {
                long wait = existing.secondsUntilResendAllowed();
                throw new RuntimeException(
                    "Please wait " + wait + " second(s) before requesting a new OTP.");
            }
        });

        // Generate a secure 6-digit OTP
        String plainOtp = generateSecureOtp();
        String hashedOtp = passwordEncoder.encode(plainOtp);

        LocalDateTime now = LocalDateTime.now();

        // Upsert: delete old record for this user then create fresh one
        otpRepo.deleteByUser(user);
        // flush() not needed in MongoDB

        OtpVerification otpRecord = OtpVerification.builder()
                .user(user)
                .otpHash(hashedOtp)
                .expiryTime(now.plusMinutes(OTP_EXPIRY_MINUTES))
                .lastSentAt(now)
                .attempts(0)
                .verified(false)
                .build();

        otpRepo.save(otpRecord);

        // Send OTP via email (async) + SMS if Twilio enabled (async)
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            emailService.sendOtp(user.getEmail(), user.getFullName(), plainOtp);
        }
        if (user.getPhone() != null && !user.getPhone().isBlank()) {
            twilioSmsService.sendOtpSms(user.getPhone(), plainOtp);
        }

        log.info("OTP generated and sent to user: {} (email: {})", user.getUserId(), user.getEmail());
        return otpRecord;
    }

    /**
     * Verifies a submitted OTP for the given user.
     *
     * @return the verified OtpVerification record
     * @throws RuntimeException on expired OTP, max attempts exceeded, or wrong OTP
     */
    @Transactional
    public OtpVerification verify(User user, String submittedOtp) {
        OtpVerification record = otpRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException(
                    "No OTP found. Please request a new one."));

        if (record.isVerified()) {
            throw new RuntimeException("OTP already used. Please log in again.");
        }

        if (record.isExpired()) {
            otpRepo.delete(record);
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        if (record.getAttempts() >= MAX_ATTEMPTS) {
            otpRepo.delete(record);
            throw new RuntimeException(
                "Maximum OTP attempts exceeded. Please log in again.");
        }

        // Increment attempt counter before checking to prevent timing attacks
        record.setAttempts(record.getAttempts() + 1);
        otpRepo.save(record);

        if (!passwordEncoder.matches(submittedOtp, record.getOtpHash())) {
            int remaining = MAX_ATTEMPTS - record.getAttempts();
            String msg = remaining > 0
                ? "Invalid OTP. " + remaining + " attempt(s) remaining."
                : "Invalid OTP. Maximum attempts reached. Please log in again.";
            if (remaining <= 0) otpRepo.delete(record);
            throw new RuntimeException(msg);
        }

        // Success — mark as verified and clean up
        record.setVerified(true);
        otpRepo.save(record);

        log.info("OTP verified successfully for user: {}", user.getUserId());
        return record;
    }

    /**
     * Returns seconds remaining in the resend cooldown window (0 if no cooldown).
     */
    public long getResendCooldown(User user) {
        return otpRepo.findByUser(user)
                .map(OtpVerification::secondsUntilResendAllowed)
                .orElse(0L);
    }

    // ── Private helpers ───────────────────────────────────────

    private String generateSecureOtp() {
        SecureRandom rng = new SecureRandom();
        int code = 100_000 + rng.nextInt(900_000); // always 6 digits
        return String.valueOf(code);
    }
}
