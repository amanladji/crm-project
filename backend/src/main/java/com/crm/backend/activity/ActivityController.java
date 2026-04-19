package com.crm.backend.activity;

import com.crm.backend.activity.dto.ActivityRequest;
import com.crm.backend.entity.Activity;
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

    @GetMapping
    public ResponseEntity<List<Activity>> getAllActivities(
            @RequestParam(required = false, defaultValue = "false") boolean paginated) {
        try {
            System.out.println("📥 ActivityController: Fetching all activities...");
            System.out.println("🔗 Endpoint: GET /api/activities");
            
            List<Activity> activities = activityService.getAllActivitiesAsList();
            
            System.out.println("✅ ActivityController: Retrieved " + activities.size() + " activities from service");
            System.out.println("📊 Response type: List<Activity>");
            System.out.println("📤 Returning response with status 200 OK");
            
            // Return direct array response (no wrapper object)
            return ResponseEntity.ok()
                    .header("X-Total-Count", String.valueOf(activities.size()))
                    .body(activities);
        } catch (Exception e) {
            System.err.println("❌ ActivityController Exception:");
            System.err.println("   Error message: " + e.getMessage());
            System.err.println("   Error type: " + e.getClass().getSimpleName());
            e.printStackTrace();
            
            // Return empty array on error (graceful degradation)
            System.out.println("📤 Returning empty array due to error");
            return ResponseEntity.ok(List.of());
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
}
