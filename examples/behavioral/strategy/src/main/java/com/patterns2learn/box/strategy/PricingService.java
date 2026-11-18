package com.patterns2learn.box.strategy;

import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class PricingService {
    // @step:service-map
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
    // @end

    public Set<String> plans() {
        return strategies.keySet();
    }
}
