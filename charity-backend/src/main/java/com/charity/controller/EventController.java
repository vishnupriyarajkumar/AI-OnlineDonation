package com.charity.controller;

import com.charity.dto.ApiResponse;
import com.charity.entity.Event;
import com.charity.repository.EventRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Tag(name = "Events", description = "Public event listings")
public class EventController {

    private final EventRepository eventRepository;

    /** Public endpoint — lists upcoming events */
    @GetMapping("/public")
    public ResponseEntity<ApiResponse<List<Event>>> publicEvents() {
        try {
            List<Event> events = eventRepository.findByStatus(Event.EventStatus.UPCOMING);
            return ResponseEntity.ok(ApiResponse.ok(events));
        } catch (Exception e) {
            // Return empty list if table doesn't exist yet
            return ResponseEntity.ok(ApiResponse.ok(List.of()));
        }
    }
}
