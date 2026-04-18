package com.crm.backend.activity;

import com.crm.backend.activity.dto.ActivityRequest;
import com.crm.backend.entity.Activity;
import com.crm.backend.entity.Customer;
import com.crm.backend.entity.Lead;
import com.crm.backend.entity.User;
import com.crm.backend.enums.ActivityType;
import com.crm.backend.exception.ResourceNotFoundException;
import com.crm.backend.repository.ActivityRepository;
import com.crm.backend.repository.CustomerRepository;
import com.crm.backend.repository.LeadRepository;
import com.crm.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final LeadRepository leadRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;

    public Page<Activity> getAllActivities(Pageable pageable) {
        return activityRepository.findAll(pageable);
    }

    public List<Activity> getActivitiesByLead(Long leadId) {
        return activityRepository.findByLeadId(leadId);
    }

    public List<Activity> getActivitiesByCustomer(Long customerId) {
        return activityRepository.findByCustomerId(customerId);
    }

    public Activity getActivityById(Long id) {
        return activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found with id: " + id));
    }

    public Activity createActivity(ActivityRequest request) {
        User performedBy = getCurrentUser();

        Activity activity = new Activity();
        activity.setDescription(request.getDescription());
        
        try {
            activity.setType(ActivityType.valueOf(request.getType().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid activity type: " + request.getType());
        }
        
        activity.setPerformedBy(performedBy);
        activity.setTimestamp(LocalDateTime.now());

        if (request.getLeadId() != null) {
            Lead lead = leadRepository.findById(request.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + request.getLeadId()));
            activity.setLead(lead);
        }

        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));
            activity.setCustomer(customer);
        }

        return activityRepository.save(activity);
    }

    public Activity updateActivity(Long id, ActivityRequest request) {
        Activity activity = getActivityById(id);

        activity.setDescription(request.getDescription());
        
        try {
            activity.setType(ActivityType.valueOf(request.getType().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid activity type: " + request.getType());
        }

        if (request.getLeadId() != null) {
            Lead lead = leadRepository.findById(request.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + request.getLeadId()));
            activity.setLead(lead);
        } else {
            activity.setLead(null);
        }

        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));
            activity.setCustomer(customer);
        } else {
            activity.setCustomer(null);
        }

        return activityRepository.save(activity);
    }

    public void deleteActivity(Long id) {
        Activity activity = getActivityById(id);
        activityRepository.delete(activity);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("User is not authenticated");
        }
        
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found: " + username));
    }
}
