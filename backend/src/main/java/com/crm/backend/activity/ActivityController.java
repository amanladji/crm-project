package com.crm.backend.activity;

import com.crm.backend.activity.dto.ActivityRequest;
import com.crm.backend.entity.Activity;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @GetMapping
    public ResponseEntity<?> getAllActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String[] sort) {
        try {
            String sortField = "timestamp";
            Sort.Direction sortDirection = Sort.Direction.DESC;
            
            if (sort != null && sort.length > 0) {
                if (sort.length == 1 && sort[0].contains(",")) {
                    String[] parts = sort[0].split(",");
                    sortField = parts[0].trim();
                    sortDirection = parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
                } else if (sort.length >= 2) {
                    sortField = sort[0];
                    sortDirection = sort[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
                } else if (sort.length == 1) {
                    sortField = sort[0];
                }
            }
            
            Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));
            Page<Activity> pageActivities = activityService.getAllActivities(pageable);
            return ResponseEntity.ok(createPaginatedResponse(pageActivities));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
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

    @GetMapping("/{id}")
    public ResponseEntity<Activity> getActivityById(@PathVariable Long id) {
        return ResponseEntity.ok(activityService.getActivityById(id));
    }

    @PostMapping
    public ResponseEntity<Activity> createActivity(@jakarta.validation.Valid @RequestBody ActivityRequest request) {
        return new ResponseEntity<>(activityService.createActivity(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Activity> updateActivity(@PathVariable Long id, @jakarta.validation.Valid @RequestBody ActivityRequest request) {
        return ResponseEntity.ok(activityService.updateActivity(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActivity(@PathVariable Long id) {
        activityService.deleteActivity(id);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> createPaginatedResponse(Page<?> pageData) {
        Map<String, Object> response = new HashMap<>();
        response.put("content", pageData.getContent());
        response.put("currentPage", pageData.getNumber());
        response.put("totalItems", pageData.getTotalElements());
        response.put("totalPages", pageData.getTotalPages());
        return response;
    }
}
