package com.charity.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * WebSocket controller for real-time activity feed.
 * Broadcasts live events to all subscribers on /topic/activity-feed.
 */
@Controller
@RequiredArgsConstructor
public class ActivityFeedController {

    private final SimpMessagingTemplate messagingTemplate;

    /** Ping from client — used to keep connection alive */
    @MessageMapping("/ping")
    @SendTo("/topic/pong")
    public Map<String, String> ping(Map<String, String> payload) {
        return Map.of("type", "PONG", "timestamp", LocalDateTime.now().toString());
    }

    /**
     * Broadcast an activity event to all connected clients.
     * Called programmatically from services after key events.
     */
    public void broadcast(String type, String message, String icon, String color) {
        Map<String, String> event = Map.of(
                "type",      type,
                "message",   message,
                "icon",      icon,
                "color",     color,
                "timestamp", LocalDateTime.now().toString()
        );
        messagingTemplate.convertAndSend("/topic/activity-feed", event);
    }
}
