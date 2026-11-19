package com.patterns2learn.box.chain.before;

import com.patterns2learn.box.chain.AccessDecision;
import com.patterns2learn.box.chain.CheckIn;

/** GoF Chain of Responsibility: each handler knows only the next one. */
public abstract class AccessHandler {
    private AccessHandler next;

    // @step:gof-handler
    public AccessHandler linkWith(AccessHandler next) {
        this.next = next;
        return next;                                   // lets you write a.linkWith(b).linkWith(c)
    }

    public AccessDecision handle(CheckIn checkIn) {
        AccessDecision mine = check(checkIn);
        if (mine != null) {
            return mine;                               // I answered: the chain stops here
        }
        return next == null ? AccessDecision.allow() : next.handle(checkIn);
    }

    /** Returns a decision to stop the chain, or null to let the next handler look. */
    protected abstract AccessDecision check(CheckIn checkIn);
    // @end
}
