package com.patterns2learn.box.strategy;

import org.springframework.stereotype.Component;

@Component("drop-in")
public class DropInPricing implements PricingStrategy {
    @Override
    public Money priceFor(PricingRequest request) {
        return Money.eur("15.00").times(request.sessions());
    }
}
