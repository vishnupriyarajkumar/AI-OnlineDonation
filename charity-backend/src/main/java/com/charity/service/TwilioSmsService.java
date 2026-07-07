package com.charity.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Optional SMS delivery of OTP codes using the Twilio API.
 *
 * Set twilio.enabled=true in application.properties and fill in
 * your Account SID, Auth Token, and from-number to activate SMS OTP.
 *
 * When disabled (default), OTP is delivered via email only.
 */
@Slf4j
@Service
public class TwilioSmsService {

    @Value("${twilio.enabled:false}")
    private boolean twilioEnabled;

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.from-number:}")
    private String fromNumber;

    @PostConstruct
    public void init() {
        if (twilioEnabled && accountSid != null && !accountSid.isBlank()) {
            Twilio.init(accountSid, authToken);
            log.info("Twilio SMS service initialized.");
        } else {
            log.info("Twilio SMS disabled — OTP will be sent via email.");
        }
    }

    /**
     * Sends a 6-digit OTP to the given phone number via SMS.
     * Silently falls through (logs error) if Twilio is disabled or fails.
     */
    @Async
    public void sendOtpSms(String toPhone, String otp) {
        if (!twilioEnabled || toPhone == null || toPhone.isBlank()) {
            log.debug("SMS skipped — Twilio disabled or phone number missing.");
            return;
        }
        try {
            Message message = Message.creator(
                    new PhoneNumber(toPhone),
                    new PhoneNumber(fromNumber),
                    "Your CharityOrg verification code is: " + otp +
                    ". It expires in 5 minutes. Do not share this code."
            ).create();
            log.info("OTP SMS sent to {} — SID: {}", toPhone, message.getSid());
        } catch (Exception e) {
            log.error("Failed to send OTP SMS to {}: {}", toPhone, e.getMessage());
            // SMS failure is non-fatal; OTP also delivered via email
        }
    }
}
