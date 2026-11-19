package com.patterns2learn.box.state;

public class UnknownMembershipException extends RuntimeException {
    public UnknownMembershipException(int id) {
        super("unknown membership: " + id);
    }
}
