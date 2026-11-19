package com.patterns2learn.box.chain;

/** The door's answer: in, or not in and why. */
public record AccessDecision(boolean granted, String reason) {
    public static AccessDecision allow() {
        return new AccessDecision(true, null);
    }

    public static AccessDecision deny(String reason) {
        return new AccessDecision(false, reason);
    }
}
