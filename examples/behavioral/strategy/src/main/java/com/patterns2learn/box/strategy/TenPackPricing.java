package com.patterns2learn.box.strategy;

import org.springframework.stereotype.Component;

// @step:ten-pack-strategy
@Component("ten-pack")
public class TenPackPricing implements PricingStrategy {
    @Override
    public Money priceFor(PricingRequest request) {
        return Money.eur("120.00").times((request.sessions() + 9) / 10);
    }
}
// @end
