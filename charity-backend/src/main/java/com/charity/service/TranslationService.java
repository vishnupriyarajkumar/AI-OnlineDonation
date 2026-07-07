package com.charity.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * AI-powered translation service using Google Gemini 2.0 Flash.
 *
 * Supported languages:
 *   en  — English (default, no translation needed)
 *   ta  — Tamil
 *   hi  — Hindi
 *   te  — Telugu
 *   ml  — Malayalam
 *   kn  — Kannada
 *
 * Caches translations in-memory to avoid repeated API calls.
 * Falls back to English if translation fails.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TranslationService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent}")
    private String geminiUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // In-memory translation cache: "lang:text" → translated text
    private final Map<String, String> cache = new ConcurrentHashMap<>();

    private static final Map<String, String> LANG_NAMES = Map.of(
        "en", "English",
        "ta", "Tamil",
        "hi", "Hindi",
        "te", "Telugu",
        "ml", "Malayalam",
        "kn", "Kannada"
    );

    /**
     * Translates text to the target language.
     * Returns original text if lang is "en" or API key not configured.
     */
    public String translate(String text, String targetLang) {
        if (text == null || text.isBlank()) return text;
        if ("en".equals(targetLang) || targetLang == null) return text;

        String langName = LANG_NAMES.getOrDefault(targetLang, "English");
        String cacheKey  = targetLang + ":" + text.hashCode();

        // Return from cache if available
        if (cache.containsKey(cacheKey)) return cache.get(cacheKey);

        // No API key configured — return original
        if (geminiApiKey == null || geminiApiKey.isBlank() ||
            geminiApiKey.equals("your-gemini-api-key-here")) {
            return text;
        }

        try {
            String translated = callGemini(text, langName);
            cache.put(cacheKey, translated);
            return translated;
        } catch (Exception e) {
            log.warn("Translation failed for lang={}: {} — falling back to English", targetLang, e.getMessage());
            return text;
        }
    }

    /**
     * Translates a Map of key→value pairs (for UI label bundles).
     * Returns the map with values translated.
     */
    public Map<String, String> translateBundle(Map<String, String> bundle, String targetLang) {
        if ("en".equals(targetLang) || targetLang == null) return bundle;
        Map<String, String> result = new java.util.LinkedHashMap<>();
        bundle.forEach((k, v) -> result.put(k, translate(v, targetLang)));
        return result;
    }

    private String callGemini(String text, String langName) {
        String prompt = String.format(
            "Translate the following text to %s. " +
            "Return ONLY the translated text with no explanations, no quotes, no markdown. " +
            "Preserve all formatting, special characters, and emojis exactly as they appear. " +
            "Text to translate: %s",
            langName, text
        );

        String requestBody = """
            {
              "contents": [{
                "parts": [{"text": "%s"}]
              }],
              "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 1024
              }
            }
            """.formatted(prompt.replace("\"", "\\\"").replace("\n", "\\n"));

        WebClient client = WebClient.create();
        String url = geminiUrl + "?key=" + geminiApiKey;

        String response = client.post()
            .uri(url)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(String.class)
            .block();

        if (response == null) throw new RuntimeException("Empty response from Gemini");

        try {
            JsonNode root = objectMapper.readTree(response);
            return root.path("candidates").get(0)
                       .path("content").path("parts").get(0)
                       .path("text").asText(text);
        } catch (Exception e) {
            throw new RuntimeException("Gemini response parse error: " + e.getMessage(), e);
        }
    }

    public boolean isConfigured() {
        return geminiApiKey != null && !geminiApiKey.isBlank()
            && !geminiApiKey.equals("your-gemini-api-key-here");
    }

    public Map<String, String> getSupportedLanguages() {
        return Map.of(
            "en", "English",
            "ta", "தமிழ் (Tamil)",
            "hi", "हिंदी (Hindi)",
            "te", "తెలుగు (Telugu)",
            "ml", "മലയാളം (Malayalam)",
            "kn", "ಕನ್ನಡ (Kannada)"
        );
    }
}
