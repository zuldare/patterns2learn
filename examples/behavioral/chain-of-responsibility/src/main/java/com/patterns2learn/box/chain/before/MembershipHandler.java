package com.patterns2learn.box.chain.before;

import com.patterns2learn.box.chain.AccessDecision;
import com.patterns2learn.box.chain.BoxRegistry;
import com.patterns2learn.box.chain.CheckIn;

public class MembershipHandler extends AccessHandler {
    private final BoxRegistry box;

    public MembershipHandler(BoxRegistry box) {
        this.box = box;
    }

    @Override
    protected AccessDecision check(CheckIn c) {
        return box.isActiveMember(c.athlete()) ? null : AccessDecision.deny("membership expired");
    }
}
