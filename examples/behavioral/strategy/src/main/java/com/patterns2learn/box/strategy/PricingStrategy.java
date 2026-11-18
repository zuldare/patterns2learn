package com.patterns2learn.box.strategy;

// @step:pricing-interface
public interface PricingStrategy {
    Money priceFor(PricingRequest request);
}
// @end
