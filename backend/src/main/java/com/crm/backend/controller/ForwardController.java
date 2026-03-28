package com.crm.backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class ForwardController {

    // Forward all non-API and non-static requests to React index.html
    @RequestMapping(value = {
            "/{path:^(?!api|static|assets|.*\\..*$).*$}/**",
            "/{path:^(?!api|static|assets|.*\\..*$).*$}"
    })
    public String redirect() {
        return "forward:/index.html";
    }
}