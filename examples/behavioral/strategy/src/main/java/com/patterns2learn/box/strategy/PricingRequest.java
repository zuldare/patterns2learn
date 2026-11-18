package com.patterns2learn.box.strategy;

public record PricingRequest(String plan, int sessions) {
    public PricingRequest {
        if (sessions < 1) {
            throw new IllegalArgumentException("sessions must be >= 1");
        }
    }
}
