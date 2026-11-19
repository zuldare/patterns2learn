package com.patterns2learn.box.chain.before;

import com.patterns2learn.box.chain.AccessDecision;
import com.patterns2learn.box.chain.BoxRegistry;
import com.patterns2learn.box.chain.CheckIn;

public class WaiverHandler extends AccessHandler {
    private final BoxRegistry box;

    public WaiverHandler(BoxRegistry box) {
        this.box = box;
    }

    @Override
    protected AccessDecision check(CheckIn c) {
        return box.hasSignedWaiver(c.athlete()) ? null : AccessDecision.deny("waiver not signed");
    }
}
