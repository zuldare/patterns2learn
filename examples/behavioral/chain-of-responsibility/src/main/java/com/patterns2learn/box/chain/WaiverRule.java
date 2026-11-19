package com.patterns2learn.box.chain;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(20)
public class WaiverRule implements AccessRule {
    private final BoxRegistry box;

    public WaiverRule(BoxRegistry box) {
        this.box = box;
    }

    @Override
    public AccessDecision check(CheckIn checkIn, AccessChain chain) {
        if (!box.hasSignedWaiver(checkIn.athlete())) {
            return AccessDecision.deny("waiver not signed");
        }
        return chain.proceed(checkIn);
    }
}
