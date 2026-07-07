package com.charity.controller;

import com.charity.dto.ApiResponse;
import com.charity.entity.User;
import com.charity.repository.UserRepository;
import com.charity.service.TranslationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/language")
@RequiredArgsConstructor
@Tag(name = "Language", description = "Multilingual preference and translation")
public class LanguageController {

    private final TranslationService translationService;
    private final UserRepository     userRepository;

    /** Get all supported languages — public */
    @GetMapping("/supported")
    public ResponseEntity<ApiResponse<Map<String, String>>> supported() {
        return ResponseEntity.ok(ApiResponse.ok(translationService.getSupportedLanguages()));
    }

    /** Get current user's preferred language — returns en if not logged in */
    @GetMapping("/preference")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPreference(
            @AuthenticationPrincipal UserDetails ud) {
        if (ud == null) return ResponseEntity.ok(ApiResponse.ok(Map.of("language", "en")));
        User user = resolve(ud);
        if (user == null) return ResponseEntity.ok(ApiResponse.ok(Map.of("language", "en")));
        String lang = user.getPreferredLanguage() != null ? user.getPreferredLanguage() : "en";
        return ResponseEntity.ok(ApiResponse.ok(Map.of("language", lang)));
    }

    /** Save user's preferred language */
    @PostMapping("/preference")
    public ResponseEntity<ApiResponse<Map<String, String>>> setPreference(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails ud) {
        String lang = body.getOrDefault("language", "en");
        if (!translationService.getSupportedLanguages().containsKey(lang)) lang = "en";

        if (ud != null) {
            User user = resolve(ud);
            if (user != null) {
                user.setPreferredLanguage(lang);
                userRepository.save(user);
            }
        }
        return ResponseEntity.ok(ApiResponse.ok("Language saved", Map.of("language", lang)));
    }

    /** Translate a single text — public */
    @PostMapping("/translate")
    @Operation(summary = "Translate text using Gemini AI")
    public ResponseEntity<ApiResponse<Map<String, String>>> translate(
            @RequestBody Map<String, String> body) {
        String text   = body.getOrDefault("text", "");
        String lang   = body.getOrDefault("language", "en");
        String result = translationService.translate(text, lang);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("translated", result, "language", lang)));
    }

    /** Translate a bundle of key-value pairs — public */
    @PostMapping("/translate-bundle")
    @Operation(summary = "Translate multiple texts at once")
    public ResponseEntity<ApiResponse<Map<String, String>>> translateBundle(
            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        Map<String, String> bundle = (Map<String, String>) body.get("texts");
        String lang = body.get("language") != null ? body.get("language").toString() : "en";
        if (bundle == null || bundle.isEmpty())
            return ResponseEntity.ok(ApiResponse.ok(Map.of()));
        Map<String, String> translated = translationService.translateBundle(bundle, lang);
        return ResponseEntity.ok(ApiResponse.ok(translated));
    }

    /** Check if Gemini is configured */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status() {
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
            "configured", translationService.isConfigured(),
            "supported",  translationService.getSupportedLanguages()
        )));
    }

    private User resolve(UserDetails ud) {
        if (ud == null) return null;
        return userRepository.findByEmail(ud.getUsername())
                .or(() -> userRepository.findByPhone(ud.getUsername()))
                .orElse(null);
    }
}
