package com.crm.backend.service;

import com.crm.backend.dto.ActivityRequest;
import com.crm.backend.entity.Activity;
import com.crm.backend.entity.Customer;
import com.crm.backend.entity.Lead;
import com.crm.backend.entity.User;
import com.crm.backend.exception.ResourceNotFoundException;
import com.crm.backend.repository.ActivityRepository;
import com.crm.backend.repository.CustomerRepository;
import com.crm.backend.repository.LeadRepository;
import com.crm.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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

    public List<Activity> getActivitiesByLead(Long leadId) {
        return activityRepository.findByLeadId(leadId);
    }

    public List<Activity> getActivitiesByCustomer(Long customerId) {
        return activityRepository.findByCustomerId(customerId);
    }

    public Activity logActivity(ActivityRequest request) {
        Activity activity = new Activity();
        activity.setDescription(request.getDescription());
        activity.setType(request.getType());
        activity.setTimestamp(LocalDateTime.now());

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getUserId()));
        activity.setPerformedBy(user);

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

        if (activity.getLead() == null && activity.getCustomer() == null) {
            throw new IllegalArgumentException("Activity must be linked to either a Lead or a Customer");
        }

        return activityRepository.save(activity);
    }
}