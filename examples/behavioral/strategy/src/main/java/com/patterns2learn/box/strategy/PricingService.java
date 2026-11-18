package com.patterns2learn.box.strategy;

import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class PricingService {
    private final Map<String, PricingStrategy> strategies;

    public PricingService(Map<String, PricingStrategy> strategies) {
        this.strategies = strategies;
    }

    public Money quote(PricingRequest request) {
        var strategy = strategies.get(request.plan());
        if (strategy == null) {
            throw new UnknownPlanException(request.plan());
        }
        return strategy.priceFor(request);
    }

    public Set<String> plans() {
        return strategies.keySet();
    }
}
