package com.charity.controller;

import com.charity.dto.ApiResponse;
import com.charity.entity.User;
import com.charity.repository.UserRepository;
import com.charity.service.EmailService;
import com.charity.service.NotificationService;
import com.charity.entity.Notification.NotificationType;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * Handles contact form submissions.
 * - Saves phone/address to user profile if userId provided
 * - Creates in-app admin notification
 * - Sends email alert to admin
 */
@Slf4j
@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
@Tag(name = "Contact", description = "Contact form and user message handling")
public class ContactController {

    private final UserRepository      userRepository;
    private final NotificationService notificationService;
    private final EmailService        emailService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> submit(@RequestBody Map<String, Object> body) {
        String name    = str(body, "name");
        String email   = str(body, "email");
        String subject = str(body, "subject");
        String message = str(body, "message");
        String phone   = str(body, "phone");
        String address = str(body, "address");
        Long   userId  = body.get("userId") != null
                       ? Long.valueOf(body.get("userId").toString()) : null;

        // If user is logged in, update their profile with phone/address
        if (userId != null) {
            Optional<User> optUser = userRepository.findById(userId);
            optUser.ifPresent(user -> {
                boolean changed = false;
                if (phone != null && !phone.isBlank() && !phone.equals(user.getPhone())) {
                    // Only set if not taken by another user
                    boolean taken = userRepository.findByPhone(phone)
                            .map(u -> !u.getUserId().equals(userId)).orElse(false);
                    if (!taken) { user.setPhone(phone); changed = true; }
                }
                if (address != null && !address.isBlank()) {
                    user.setAddress(address); changed = true;
                }
                if (changed) {
                    userRepository.save(user);
                    log.info("Contact form updated profile for user {}", userId);
                }

                // Notify admin via in-app notification
                String details = String.format(
                    "From: %s (%s) | Subject: %s | Message: %s",
                    name, email, subject,
                    message.length() > 100 ? message.substring(0, 100) + "…" : message
                );

                // Send admin email alert
                userRepository.findByEmail("newdawnfoundationtrust@gmail.com").ifPresent(admin -> {
                    notificationService.send(admin, NotificationType.ADMIN_NEW_USER,
                            "📬 New Contact Message: " + subject,
                            details, "/admin", false);
                    emailService.sendAdminAlert(admin.getEmail(),
                            "New Contact Message from " + name,
                            details);
                });
            });
        } else {
            // Anonymous contact — just notify admin
            String details = String.format(
                "From: %s (%s) | Subject: %s | Message: %s",
                name, email, subject,
                message.length() > 100 ? message.substring(0, 100) + "…" : message
            );
            userRepository.findByEmail("newdawnfoundationtrust@gmail.com").ifPresent(admin -> {
                notificationService.send(admin, NotificationType.ADMIN_NEW_USER,
                        "📬 New Contact Message: " + subject,
                        details, "/admin", false);
                emailService.sendAdminAlert(admin.getEmail(),
                        "New Contact Message from " + name + " (" + email + ")",
                        details);
            });
        }

        log.info("Contact form submitted by {} <{}>: {}", name, email, subject);
        return ResponseEntity.ok(ApiResponse.ok("Message received. We'll respond within 24 hours.", null));
    }

    private String str(Map<String, Object> m, String key) {
        return m.get(key) != null ? m.get(key).toString().trim() : "";
    }
}
