package com.crm.backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ForwardController {

    // Redirect SPA routes to index.html for React routing
    @GetMapping("/")
    public String root() {
        return "forward:/index.html";
    }
    
    @GetMapping("/dashboard")
    public String dashboard() {
        return "forward:/index.html";
    }
    
    @GetMapping("/chat")
    public String chat() {
        return "forward:/index.html";
    }
    
    @GetMapping("/activity")
    public String activity() {
        return "forward:/index.html";
    }
    
    @GetMapping("/customers")
    public String customers() {
        return "forward:/index.html";
    }
    
    @GetMapping("/customers/{id}")
    public String customerDetails() {
        return "forward:/index.html";
    }
    
    @GetMapping("/leads")
    public String leads() {
        return "forward:/index.html";
    }
    
    @GetMapping("/settings")
    public String settings() {
        return "forward:/index.html";
    }
    
    @GetMapping("/login")
    public String login() {
        return "forward:/index.html";
    }
    
    @GetMapping("/register")
    public String register() {
        return "forward:/index.html";
    }
}
