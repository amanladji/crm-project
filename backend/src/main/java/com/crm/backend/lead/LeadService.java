package com.crm.backend.lead;

import com.crm.backend.lead.dto.LeadRequest;
import com.crm.backend.entity.Customer;
import com.crm.backend.entity.Lead;
import com.crm.backend.entity.User;
import com.crm.backend.enums.LeadStatus;
import com.crm.backend.exception.ResourceNotFoundException;
import com.crm.backend.repository.CustomerRepository;
import com.crm.backend.repository.LeadRepository;
import com.crm.backend.repository.UserRepository;
import com.crm.backend.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final ActivityRepository activityRepository;

    public Page<Lead> getAllLeads(Pageable pageable) {
        return leadRepository.findAll(pageable);
    }

    public Page<Lead> searchAndFilterLeads(String query, String statusString, Pageable pageable) {
        LeadStatus status = null;
        if (statusString != null && !statusString.trim().isEmpty()) {
            try {
                status = LeadStatus.valueOf(statusString.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid status: " + statusString);
            }
        }
        String searchQuery = (query == null || query.trim().isEmpty()) ? null : query.trim();
        
        // Route to appropriate query method based on whether query and status are provided
        if (searchQuery == null && status == null) {
            // No search query and no status filter
            return leadRepository.searchLeadsNoQuery(pageable);
        } else if (searchQuery != null && status == null) {
            // Search query provided, no status filter
            return leadRepository.searchLeads(searchQuery, pageable);
        } else if (searchQuery == null && status != null) {
            // Status filter provided, no search query
            return leadRepository.filterLeadsByStatus(status, pageable);
        } else {
            // Both search query and status filter provided
            return leadRepository.filterLeadsByStatusAndSearch(searchQuery, status, pageable);
        }
    }

    public Lead getLeadById(Long id) {
        return leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id: " + id));
    }

    public List<Lead> getLeadsByAssignee(Long userId) {
        return leadRepository.findByAssignedUserId(userId);
    }

    public Lead createLead(LeadRequest request) {
        if (request.getCustomerId() == null) {
            throw new IllegalArgumentException("Customer field is required to create a lead");
        }
        
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));

        Lead lead = new Lead();
        lead.setName(request.getName());
        lead.setEmail(request.getEmail());
        lead.setPhone(request.getPhone());
        lead.setCompany(request.getCompany());
        lead.setStatus(request.getStatus() != null ? request.getStatus() : LeadStatus.NEW);
        lead.setCreatedAt(LocalDateTime.now());
        lead.setCustomer(customer);

        if (request.getAssignedUserId() != null) {
            User user = userRepository.findById(request.getAssignedUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getAssignedUserId()));
            lead.setAssignedUser(user);
        }

        return leadRepository.save(lead);
    }

    public Lead updateLead(Long id, LeadRequest request) {
        Lead lead = getLeadById(id);
        
        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.getCustomerId()));
            lead.setCustomer(customer);
        }

        lead.setName(request.getName());
        lead.setEmail(request.getEmail());
        lead.setPhone(request.getPhone());
        lead.setCompany(request.getCompany());
        
        if (request.getStatus() != null) {
            lead.setStatus(request.getStatus());
        }

        if (request.getAssignedUserId() != null) {
            User user = userRepository.findById(request.getAssignedUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getAssignedUserId()));
            lead.setAssignedUser(user);
        } else {
            lead.setAssignedUser(null);
        }

        return leadRepository.save(lead);
    }

    public Lead updateLeadStatus(Long id, String statusString) {
        Lead lead = getLeadById(id);
        try {
            LeadStatus status = LeadStatus.valueOf(statusString.toUpperCase());
            lead.setStatus(status);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + statusString);
        }
        return leadRepository.save(lead);
    }

    @org.springframework.transaction.annotation.Transactional(rollbackFor = Exception.class)
    public void deleteLead(Long id) {
        Lead lead = getLeadById(id);
        
        // Delete all activities associated with this lead before deleting to prevent foreign key errors
        java.util.List<com.crm.backend.entity.Activity> activities = activityRepository.findByLeadId(id);
        System.out.println("### DEBUG: Found " + activities.size() + " activities to delete for lead " + id);
        activityRepository.deleteAll(activities);

        leadRepository.delete(lead);
    }
}
