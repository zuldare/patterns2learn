package com.patterns2learn.box.state;

public record MembershipView(int id, String athlete, MembershipState state, int trialVisitsLeft) {
    static MembershipView of(Membership m) {
        return new MembershipView(m.id(), m.athlete(), m.state(), m.trialVisitsLeft());
    }
}
