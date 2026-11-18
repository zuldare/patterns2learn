package com.patterns2learn.box.strategy;

public interface PricingStrategy {
    Money priceFor(PricingRequest request);
}
