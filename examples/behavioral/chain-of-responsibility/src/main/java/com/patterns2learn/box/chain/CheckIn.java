package com.patterns2learn.box.chain;

/** An athlete tapping their card at the door for a class session. */
public record CheckIn(String athlete, long sessionId) {
    public CheckIn {
        if (athlete == null || athlete.isBlank()) throw new IllegalArgumentException("athlete is required");
    }
}
