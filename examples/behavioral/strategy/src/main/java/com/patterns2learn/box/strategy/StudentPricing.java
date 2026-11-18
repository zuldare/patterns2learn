package com.patterns2learn.box.strategy;

import org.springframework.stereotype.Component;

// @step:student-strategy
@Component("student")
public class StudentPricing implements PricingStrategy {
    @Override
    public Money priceFor(PricingRequest request) {
        return Money.eur("79.00").percentOff(20);
    }
}
// @end
