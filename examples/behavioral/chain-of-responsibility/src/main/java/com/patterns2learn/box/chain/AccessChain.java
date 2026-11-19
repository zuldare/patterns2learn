package com.patterns2learn.box.chain;

import java.util.List;

/**
 * The rest of the chain, as seen by one rule: like a servlet FilterChain.
 * Each rule gets its own instance and may call proceed() at most once.
 */
public final class AccessChain {
    private final List<AccessRule> rules;
    private final int index;
    private boolean used;

    AccessChain(List<AccessRule> rules, int index) {
        this.rules = rules;
        this.index = index;
    }

    // @step:chain
    public AccessDecision proceed(CheckIn checkIn) {
        if (used) {
            throw new IllegalStateException("proceed() called more than once by the same rule");
        }
        used = true;
        if (index == rules.size()) {
            return AccessDecision.allow();                              // nobody objected: in you go
        }
        AccessRule next = rules.get(index);
        return next.check(checkIn, new AccessChain(rules, index + 1));  // it decides whether to go on
    }
    // @end
}
