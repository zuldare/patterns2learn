package com.patterns2learn.box.chain;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

// @step:capacity
@Component
@Order(30)   // last on purpose: the only rule with a side effect (it takes a spot)
public class CapacityRule implements AccessRule {
    private final BoxRegistry box;

    public CapacityRule(BoxRegistry box) {
        this.box = box;
    }

    @Override
    public AccessDecision check(CheckIn checkIn, AccessChain chain) {
        if (!box.sessionExists(checkIn.sessionId())) {
            return AccessDecision.deny("unknown session: " + checkIn.sessionId());
        }
        if (!box.takeSpot(checkIn.sessionId())) {
            return AccessDecision.deny("class is full");
        }
        return chain.proceed(checkIn);
    }
}
// @end
