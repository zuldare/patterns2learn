package com.patterns2learn.box.chain;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

// @step:rule
@Component
@Order(10)
public class MembershipRule implements AccessRule {
    private final BoxRegistry box;

    public MembershipRule(BoxRegistry box) {
        this.box = box;
    }

    @Override
    public AccessDecision check(CheckIn checkIn, AccessChain chain) {
        if (!box.isKnown(checkIn.athlete())) {
            return AccessDecision.deny("unknown athlete");
        }
        if (!box.isActiveMember(checkIn.athlete())) {
            return AccessDecision.deny("membership expired");   // stop: the rest never runs
        }
        return chain.proceed(checkIn);                             // not my problem: next one
    }
}
// @end
