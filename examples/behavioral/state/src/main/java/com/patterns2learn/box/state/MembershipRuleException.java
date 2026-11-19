package com.patterns2learn.box.state;

/** The membership's current state doesn't allow that action. */
public class MembershipRuleException extends RuntimeException {
    public MembershipRuleException(String message) {
        super(message);
    }
}
