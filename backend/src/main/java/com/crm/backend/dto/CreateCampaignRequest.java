package com.crm.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateCampaignRequest {
    
    @NotBlank(message = "Campaign name is required")
    private String name;
    
    private String description;
    
    @NotBlank(message = "Campaign message is required")
    private String message;
    
    private List<Long> userIds;
}
