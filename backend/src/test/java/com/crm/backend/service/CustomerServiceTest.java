package com.crm.backend.service;

import com.crm.backend.entity.Customer;
import com.crm.backend.exception.ResourceNotFoundException;
import com.crm.backend.repository.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CustomerServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private CustomerService customerService;

    private Customer testCustomer;

    @BeforeEach
    void setUp() {
        testCustomer = new Customer();
        testCustomer.setId(1L);
        testCustomer.setName("Test Company");
        testCustomer.setEmail("test@company.com");
    }

    @Test
    void getAllCustomers_ReturnsList() {
        org.springframework.data.domain.Page<Customer> page = new org.springframework.data.domain.PageImpl<>(Arrays.asList(testCustomer));
        when(customerRepository.findAll(org.mockito.ArgumentMatchers.any(org.springframework.data.domain.Pageable.class))).thenReturn(page);

        org.springframework.data.domain.Page<Customer> result = customerService.getAllCustomers(org.springframework.data.domain.PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("Test Company", result.getContent().get(0).getName());
        verify(customerRepository, times(1)).findAll(org.mockito.ArgumentMatchers.any(org.springframework.data.domain.Pageable.class));
    }

    @Test
    void getCustomerById_WhenFound_ReturnsCustomer() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(testCustomer));

        Customer result = customerService.getCustomerById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void getCustomerById_WhenNotFound_ThrowsException() {
        when(customerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> customerService.getCustomerById(99L));
    }

    @Test
    void createCustomer_SavesAndReturnsCustomer() {
        when(customerRepository.save(any(Customer.class))).thenReturn(testCustomer);

        Customer result = customerService.createCustomer(testCustomer);

        assertNotNull(result);
        assertEquals("Test Company", result.getName());
        verify(customerRepository, times(1)).save(any(Customer.class));
    }
}