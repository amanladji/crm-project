package com.crm.backend.controller;

import com.crm.backend.dto.LeadRequest;
import com.crm.backend.entity.Lead;
import com.crm.backend.service.LeadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leads")
@RequiredArgsConstructor
public class LeadController {

    private final LeadService leadService;

    @GetMapping
    public ResponseEntity<List<Lead>> getAllLeads() {
        return ResponseEntity.ok(leadService.getAllLeads());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Lead> getLeadById(@PathVariable Long id) {
        return ResponseEntity.ok(leadService.getLeadById(id));
    }
    
    @GetMapping("/assignee/{userId}")
    public ResponseEntity<List<Lead>> getLeadsByAssignee(@PathVariable Long userId) {
        return ResponseEntity.ok(leadService.getLeadsByAssignee(userId));
    }

    @PostMapping
    public ResponseEntity<Lead> createLead(@jakarta.validation.Valid @RequestBody LeadRequest request) {
        return new ResponseEntity<>(leadService.createLead(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Lead> updateLead(@PathVariable Long id, @jakarta.validation.Valid @RequestBody LeadRequest request) {
        return ResponseEntity.ok(leadService.updateLead(id, request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateLeadStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String status = payload.get("status");
            if (status == null || status.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Status is required");
            }
            return ResponseEntity.ok(leadService.updateLeadStatus(id, status));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLead(@PathVariable Long id) {
        leadService.deleteLead(id);
        return ResponseEntity.noContent().build();
    }
}