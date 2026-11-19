package com.patterns2learn.box.chain.before;

import com.patterns2learn.box.chain.AccessDecision;
import com.patterns2learn.box.chain.BoxRegistry;
import com.patterns2learn.box.chain.CheckIn;

public class CapacityHandler extends AccessHandler {
    private final BoxRegistry box;

    public CapacityHandler(BoxRegistry box) {
        this.box = box;
    }

    @Override
    protected AccessDecision check(CheckIn c) {
        if (!box.sessionExists(c.sessionId())) return AccessDecision.deny("unknown session: " + c.sessionId());
        return box.takeSpot(c.sessionId()) ? null : AccessDecision.deny("class is full");
    }
}
