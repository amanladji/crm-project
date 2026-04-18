package com.crm.backend.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for returning current user information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CurrentUserDTO {
    @JsonProperty("id")
    private Long id;
    
    @JsonProperty("username")
    private String username;
    
    @JsonProperty("role")
    private String role;
}
