package com.crm.backend.customer;

import com.crm.backend.entity.Customer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Validated
@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String[] sort) {

        log.info("Fetching customers - page: {}, size: {}, sortField: {}", page, size, sort[0]);
        
        String sortField = sort[0];
        Sort.Direction sortDirection = sort[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));
        
        Page<Customer> pageCustomers = customerService.getAllCustomers(pageable);
        log.info("Retrieved {} customers from total {}", pageCustomers.getContent().size(), pageCustomers.getTotalElements());
        
        return ResponseEntity.ok(createPaginatedResponse(pageCustomers));
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchCustomers(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id,desc") String[] sort) {

        log.info("Searching customers - query: {}, page: {}, size: {}", query, page, size);
        
        String sortField = sort[0];
        Sort.Direction sortDirection = sort[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortField));
        
        Page<Customer> pageCustomers = customerService.searchCustomers(query, pageable);
        log.info("Search returned {} customers", pageCustomers.getContent().size());
        
        return ResponseEntity.ok(createPaginatedResponse(pageCustomers));
    }
    
    private Map<String, Object> createPaginatedResponse(Page<?> pageData) {
        Map<String, Object> response = new HashMap<>();
        response.put("content", pageData.getContent());
        response.put("currentPage", pageData.getNumber());
        response.put("totalItems", pageData.getTotalElements());
        response.put("totalPages", pageData.getTotalPages());
        return response;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        log.info("Fetching customer with id: {}", id);
        Customer customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(customer);
    }

    @GetMapping("/{id}/leads")
    public ResponseEntity<List<com.crm.backend.entity.Lead>> getLeadsForCustomer(@PathVariable Long id) {
        log.info("Fetching leads for customer id: {}", id);
        List<com.crm.backend.entity.Lead> leads = customerService.getLeadsForCustomer(id);
        return ResponseEntity.ok(leads);
    }

    @GetMapping("/{id}/activities")
    public ResponseEntity<List<com.crm.backend.entity.Activity>> getActivitiesForCustomer(@PathVariable Long id) {
        log.info("Fetching activities for customer id: {}", id);
        List<com.crm.backend.entity.Activity> activities = customerService.getActivitiesForCustomer(id);
        return ResponseEntity.ok(activities);
    }

    @PostMapping
    public ResponseEntity<Customer> createCustomer(@Valid @RequestBody Customer customer) {
        log.info("Creating new customer - name: {}, email: {}", customer.getName(), customer.getEmail());
        
        // Validate input
        if (customer == null) {
            log.error("Customer object is null");
            throw new IllegalArgumentException("Customer data is required");
        }
        
        if (customer.getName() == null || customer.getName().trim().isEmpty()) {
            log.error("Customer name is empty");
            throw new IllegalArgumentException("Customer name is required");
        }
        
        if (customer.getEmail() == null || customer.getEmail().trim().isEmpty()) {
            log.error("Customer email is empty");
            throw new IllegalArgumentException("Customer email is required");
        }
        
        try {
            Customer savedCustomer = customerService.createCustomer(customer);
            log.info("✅ Customer created successfully with id: {}", savedCustomer.getId());
            return new ResponseEntity<>(savedCustomer, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            log.error("❌ Validation error creating customer: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ Error creating customer: {}", e.getMessage(), e);
            throw e;
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Customer> updateCustomer(
            @PathVariable Long id, 
            @Valid @RequestBody Customer customerDetails) {
        
        log.info("Updating customer id: {} - name: {}, email: {}", id, customerDetails.getName(), customerDetails.getEmail());
        
        if (customerDetails == null) {
            log.error("Customer details object is null");
            throw new IllegalArgumentException("Customer data is required");
        }
        
        if (customerDetails.getName() == null || customerDetails.getName().trim().isEmpty()) {
            log.error("Updated customer name is empty");
            throw new IllegalArgumentException("Customer name is required");
        }
        
        if (customerDetails.getEmail() == null || customerDetails.getEmail().trim().isEmpty()) {
            log.error("Updated customer email is empty");
            throw new IllegalArgumentException("Customer email is required");
        }
        
        try {
            Customer updatedCustomer = customerService.updateCustomer(id, customerDetails);
            log.info("✅ Customer id {} updated successfully", id);
            return ResponseEntity.ok(updatedCustomer);
        } catch (Exception e) {
            log.error("❌ Error updating customer id {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        log.info("Deleting customer id: {}", id);
        
        try {
            customerService.deleteCustomer(id);
            log.info("✅ Customer id {} deleted successfully", id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("❌ Error deleting customer id {}: {}", id, e.getMessage(), e);
            throw e;
        }
    }
}
