package com.patterns2learn.box.strategy.web;

import com.patterns2learn.box.strategy.PricingRequest;
import com.patterns2learn.box.strategy.PricingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pricing")
public class PricingController {
    private final PricingService pricing;

    public PricingController(PricingService pricing) {
        this.pricing = pricing;
    }

    // @step:controller
    @GetMapping("/quote")
    public QuoteResponse quote(@RequestParam String plan, @RequestParam int sessions) {
        var price = pricing.quote(new PricingRequest(plan, sessions));
        return new QuoteResponse(plan, sessions, price.amount().toPlainString());
    }
    // @end
}
