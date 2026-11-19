package com.patterns2learn.box.chain;

import java.util.List;

/** One walk through the rules for one check-in, like a servlet FilterChain. */
public final class AccessChain {
    private final List<AccessRule> rules;
    private int position;

    AccessChain(List<AccessRule> rules) {
        this.rules = rules;
    }

    // @step:chain
    public AccessDecision proceed(CheckIn checkIn) {
        if (position == rules.size()) {
            return AccessDecision.allow();      // nobody objected: in you go
        }
        AccessRule next = rules.get(position++);
        return next.check(checkIn, this);         // the rule decides whether to call proceed() again
    }
    // @end
}
