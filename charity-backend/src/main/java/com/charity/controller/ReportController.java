package com.charity.controller;

import com.charity.dto.ApiResponse;
import com.charity.service.ReportService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Reports & Statistics", description = "Stats, charts, reports")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/stats/public")
    public ResponseEntity<ApiResponse<Map<String, Object>>> publicStats() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getPublicStats()));
    }

    @GetMapping("/admin/reports/monthly")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Object[]>>> monthlyReport(
            @RequestParam(defaultValue = "0") int year) {
        if (year == 0) year = LocalDate.now().getYear();
        return ResponseEntity.ok(ApiResponse.ok(reportService.getMonthlyDonations(year)));
    }

    @GetMapping("/admin/reports/campaign/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> campaignReport(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getCampaignReport(id)));
    }
}
