package com.patterns2learn.box.chain.before;

import com.patterns2learn.box.chain.AccessDecision;
import com.patterns2learn.box.chain.BoxRegistry;
import com.patterns2learn.box.chain.CheckIn;

/** Before: every rule of the door in one method. */
public class MonolithicCheckIn {
    private final BoxRegistry box;

    public MonolithicCheckIn(BoxRegistry box) {
        this.box = box;
    }

    // @step:monolith
    public AccessDecision checkIn(CheckIn c) {
        if (!box.isActiveMember(c.athlete())) {
            return AccessDecision.deny("membership expired");
        }
        if (!box.hasSignedWaiver(c.athlete())) {
            return AccessDecision.deny("waiver not signed");
        }
        // new rule? open this method, find the right spot, hope you don't break the others
        if (!box.sessionExists(c.sessionId())) {
            return AccessDecision.deny("unknown session: " + c.sessionId());
        }
        if (!box.takeSpot(c.sessionId())) {
            return AccessDecision.deny("class is full");
        }
        return AccessDecision.allow();
    }
    // @end
}
