package com.crm.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AnalyticsResponse {
    private long totalCustomers;
    private long totalLeads;
    private long newLeads;
    private long convertedLeads;
    private long totalActivities;
    private double conversionRate;
}