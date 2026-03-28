package com.crm.backend.dto;

import com.crm.backend.enums.LeadStatus;
import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class LeadRequest {
    @NotBlank(message = "Title is required")
    private String name;
    
    private String email;
    private String phone;
    private String company;
    
    @NotNull(message = "Status is required")
    private LeadStatus status;
    private Long assignedUserId;
    
    @NotNull(message = "Customer is required")
    private Long customerId;
}