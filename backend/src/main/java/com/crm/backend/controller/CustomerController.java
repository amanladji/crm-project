package com.crm.backend.controller;

import com.crm.backend.entity.Customer;
import com.crm.backend.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    @GetMapping("/{id}/leads")
    public ResponseEntity<List<com.crm.backend.entity.Lead>> getLeadsForCustomer(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getLeadsForCustomer(id));
    }

    @GetMapping("/{id}/activities")
    public ResponseEntity<List<com.crm.backend.entity.Activity>> getActivitiesForCustomer(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getActivitiesForCustomer(id));
    }

    @PostMapping
    public ResponseEntity<Customer> createCustomer(@jakarta.validation.Valid @RequestBody Customer customer) {
        return new ResponseEntity<>(customerService.createCustomer(customer), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Customer> updateCustomer(@PathVariable Long id, @jakarta.validation.Valid @RequestBody Customer customerDetails) {
        return ResponseEntity.ok(customerService.updateCustomer(id, customerDetails));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }
}