package com.crm.backend.activity.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class ActivityRequest {
    @NotBlank(message = "Description is required")
    private String description;
    
    @NotBlank(message = "Activity type is required")
    private String type;
    
    private Long leadId;
    private Long customerId;
}
