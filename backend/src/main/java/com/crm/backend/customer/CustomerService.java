package com.crm.backend.customer;

import com.crm.backend.entity.Customer;
import com.crm.backend.entity.Lead;
import com.crm.backend.entity.Activity;
import com.crm.backend.exception.ResourceNotFoundException;
import com.crm.backend.repository.CustomerRepository;
import com.crm.backend.repository.LeadRepository;
import com.crm.backend.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final LeadRepository leadRepository;
    private final ActivityRepository activityRepository;

    /**
     * Get all customers with pagination
     */
    public Page<Customer> getAllCustomers(Pageable pageable) {
        try {
            log.debug("Fetching all customers with pagination: {}", pageable);
            Page<Customer> customers = customerRepository.findAll(pageable);
            log.info("Retrieved {} customers", customers.getTotalElements());
            return customers;
        } catch (Exception e) {
            log.error("Error fetching all customers", e);
            throw new RuntimeException("Failed to fetch customers: " + e.getMessage());
        }
    }

    /**
     * Search customers by query
     */
    public Page<Customer> searchCustomers(String query, Pageable pageable) {
        try {
            log.debug("Searching customers with query: '{}'", query);
            
            if (query == null || query.trim().isEmpty()) {
                return getAllCustomers(pageable);
            }
            
            Page<Customer> results = customerRepository.searchCustomers(query, pageable);
            log.info("Search found {} customers matching query: '{}'", results.getTotalElements(), query);
            return results;
        } catch (Exception e) {
            log.error("Error searching customers with query: '{}'", query, e);
            throw new RuntimeException("Failed to search customers: " + e.getMessage());
        }
    }

    /**
     * Get customer by ID
     */
    public Customer getCustomerById(Long id) {
        try {
            log.debug("Fetching customer with id: {}", id);
            
            if (id == null || id <= 0) {
                throw new IllegalArgumentException("Invalid customer ID: " + id);
            }
            
            return customerRepository.findById(id)
                    .orElseThrow(() -> {
                        log.warn("Customer not found with id: {}", id);
                        return new ResourceNotFoundException("Customer not found with id: " + id);
                    });
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching customer with id: {}", id, e);
            throw new RuntimeException("Failed to fetch customer: " + e.getMessage());
        }
    }

    /**
     * Get leads for a customer
     */
    public List<Lead> getLeadsForCustomer(Long id) {
        try {
            log.debug("Fetching leads for customer id: {}", id);
            
            // Validate customer exists first
            getCustomerById(id);
            
            List<Lead> leads = leadRepository.findByCustomerId(id);
            log.info("Found {} leads for customer id: {}", leads.size(), id);
            return leads;
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching leads for customer id: {}", id, e);
            throw new RuntimeException("Failed to fetch leads: " + e.getMessage());
        }
    }

    /**
     * Get activities for a customer
     */
    public List<Activity> getActivitiesForCustomer(Long id) {
        try {
            log.debug("Fetching activities for customer id: {}", id);
            
            // Validate customer exists first
            getCustomerById(id);
            
            List<Activity> activities = activityRepository.findByCustomerId(id);
            log.info("Found {} activities for customer id: {}", activities.size(), id);
            return activities;
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching activities for customer id: {}", id, e);
            throw new RuntimeException("Failed to fetch activities: " + e.getMessage());
        }
    }

    /**
     * Create a new customer
     */
    @Transactional
    public Customer createCustomer(Customer customer) {
        try {
            log.info("Creating new customer - name: {}, email: {}", customer.getName(), customer.getEmail());
            
            // Validate required fields
            validateCustomerData(customer);
            
            Customer savedCustomer = customerRepository.save(customer);
            log.info("✅ Customer created successfully with id: {}, email: {}", savedCustomer.getId(), savedCustomer.getEmail());
            return savedCustomer;
        } catch (DataIntegrityViolationException e) {
            log.error("❌ Duplicate email or unique constraint violation: {}", e.getMessage());
            throw e;
        } catch (IllegalArgumentException e) {
            log.error("❌ Validation error while creating customer: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Error creating customer", e);
            throw new RuntimeException("Failed to create customer: " + e.getMessage());
        }
    }

    /**
     * Update an existing customer
     */
    @Transactional
    public Customer updateCustomer(Long id, Customer customerDetails) {
        try {
            log.info("Updating customer id: {} - name: {}, email: {}", id, customerDetails.getName(), customerDetails.getEmail());
            
            // Validate input data
            validateCustomerData(customerDetails);
            
            // Get existing customer
            Customer customer = getCustomerById(id);
            
            // Update fields
            customer.setName(customerDetails.getName());
            customer.setEmail(customerDetails.getEmail());
            customer.setPhone(customerDetails.getPhone());
            customer.setCompany(customerDetails.getCompany());
            customer.setAddress(customerDetails.getAddress());
            
            Customer updatedCustomer = customerRepository.save(customer);
            log.info("✅ Customer id {} updated successfully", id);
            return updatedCustomer;
        } catch (DataIntegrityViolationException e) {
            log.error("❌ Duplicate email or unique constraint violation for customer id {}: {}", id, e.getMessage());
            throw e;
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (IllegalArgumentException e) {
            log.error("❌ Validation error while updating customer id {}: {}", id, e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Error updating customer id {}", id, e);
            throw new RuntimeException("Failed to update customer: " + e.getMessage());
        }
    }

    /**
     * Delete a customer and all associated data
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteCustomer(Long id) {
        try {
            log.info("Starting deletion of customer id: {}", id);
            
            // Validate customer exists
            Customer customer = getCustomerById(id);
            
            // Delete all activities associated with customer's leads
            List<Lead> leads = leadRepository.findByCustomerId(id);
            log.debug("Found {} leads associated with customer id: {}", leads.size(), id);
            
            for (Lead lead : leads) {
                List<Activity> leadActivities = activityRepository.findByLeadId(lead.getId());
                log.debug("Deleting {} activities for lead id: {}", leadActivities.size(), lead.getId());
                activityRepository.deleteAll(leadActivities);
            }
            
            // Delete all leads associated with customer
            log.debug("Deleting {} leads for customer id: {}", leads.size(), id);
            leadRepository.deleteAll(leads);
            
            // Delete all direct activities associated with customer
            List<Activity> customerActivities = activityRepository.findByCustomerId(id);
            log.debug("Deleting {} direct activities for customer id: {}", customerActivities.size(), id);
            activityRepository.deleteAll(customerActivities);
            
            // Delete the customer
            customerRepository.delete(customer);
            log.info("✅ Customer id {} deleted successfully with all associated data", id);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Error deleting customer id: {}", id, e);
            throw new RuntimeException("Failed to delete customer: " + e.getMessage());
        }
    }

    /**
     * Validate customer data
     */
    private void validateCustomerData(Customer customer) {
        if (customer == null) {
            throw new IllegalArgumentException("Customer data is required");
        }
        
        if (customer.getName() == null || customer.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Customer name is required");
        }
        
        if (customer.getEmail() == null || customer.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Customer email is required");
        }
        
        // Validate email format
        if (!customer.getEmail().matches("^[\\w._%+-]+@[\\w.-]+\\.[A-Za-z]{2,}$")) {
            throw new IllegalArgumentException("Invalid email format");
        }
        
        // Validate phone if provided
        if (customer.getPhone() != null && !customer.getPhone().isEmpty()) {
            if (!customer.getPhone().matches("^[0-9]{10}$")) {
                throw new IllegalArgumentException("Phone must be 10 digits");
            }
        }
    }
}
