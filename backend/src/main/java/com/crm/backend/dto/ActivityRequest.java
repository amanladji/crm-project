package com.crm.backend.dto;

import com.crm.backend.enums.ActivityType;
import lombok.Data;

@Data
public class ActivityRequest {
    private String description;
    private ActivityType type;
    private Long leadId;
    private Long customerId;
    private Long userId;
}