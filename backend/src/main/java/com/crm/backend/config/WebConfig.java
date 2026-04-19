package com.crm.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                    // Development
                    "http://localhost:5173", 
                    "http://localhost:5174", 
                    "http://localhost:5175", 
                    "http://localhost:5176",
                    "http://localhost:3000",
                    "http://localhost:8081",
                    // Production - allow requests from same origin and any origin for API calls
                    "*"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(false)  // Set to false when using wildcard origin
                .maxAge(3600);
    }
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // ONLY serve specific assets - NOT index.html as a fallback for unknown paths
        // All requests are now handled through API endpoints or frontend routing
        
        // Serve assets folder
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/")
                .setCachePeriod(3600);
        
        // Serve favicon and SVG files
        registry.addResourceHandler("/favicon.svg", "/icons.svg")
                .addResourceLocations("classpath:/static/")
                .setCachePeriod(3600);
        
        // DO NOT add a catch-all /** mapping that serves index.html
        // This prevents admin paths from being intercepted inappropriately
    }
}
