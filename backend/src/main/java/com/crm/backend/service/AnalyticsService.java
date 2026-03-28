package com.crm.backend.service;

import com.crm.backend.dto.AnalyticsResponse;
import com.crm.backend.enums.LeadStatus;
import com.crm.backend.repository.ActivityRepository;
import com.crm.backend.repository.CustomerRepository;
import com.crm.backend.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final CustomerRepository customerRepository;
    private final LeadRepository leadRepository;
    private final ActivityRepository activityRepository;

    public AnalyticsResponse getDashboardAnalytics() {
        long totalCustomers = customerRepository.count();
        long totalLeads = leadRepository.count();
        long newLeads = leadRepository.countByStatus(LeadStatus.NEW);
        long convertedLeads = leadRepository.countByStatus(LeadStatus.CONVERTED);
        long totalActivities = activityRepository.count();
        
        double conversionRate = 0.0;
        if (totalLeads > 0) {
            conversionRate = (convertedLeads * 100.0) / totalLeads;
        }

        return new AnalyticsResponse(
                totalCustomers,
                totalLeads,
                newLeads,
                convertedLeads,
                totalActivities,
                conversionRate
        );
    }
}