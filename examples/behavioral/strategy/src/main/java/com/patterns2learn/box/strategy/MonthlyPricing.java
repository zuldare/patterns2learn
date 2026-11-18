package com.patterns2learn.box.strategy;

import org.springframework.stereotype.Component;

@Component("monthly")
public class MonthlyPricing implements PricingStrategy {
    @Override
    public Money priceFor(PricingRequest request) {
        return Money.eur("79.00");
    }
}
