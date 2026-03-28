package com.crm.backend.controller;

import com.crm.backend.dto.ActivityRequest;
import com.crm.backend.entity.Activity;
import com.crm.backend.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping
    public ResponseEntity<Activity> logActivity(@RequestBody ActivityRequest request) {
        try {
            return new ResponseEntity<>(activityService.logActivity(request), HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<List<Activity>> getActivitiesByLead(@PathVariable Long leadId) {
        return ResponseEntity.ok(activityService.getActivitiesByLead(leadId));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Activity>> getActivitiesByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(activityService.getActivitiesByCustomer(customerId));
    }
}