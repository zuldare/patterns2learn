package com.patterns2learn.box.chain;

import com.fasterxml.jackson.annotation.JsonInclude;

/** The door's answer: in, or not in and why. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AccessDecision(boolean granted, String reason) {
    public static AccessDecision allow() {
        return new AccessDecision(true, null);
    }

    public static AccessDecision deny(String reason) {
        return new AccessDecision(false, reason);
    }
}
