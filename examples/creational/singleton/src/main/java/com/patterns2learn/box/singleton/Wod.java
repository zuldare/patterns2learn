package com.patterns2learn.box.singleton;

/** A named workout of the day, e.g. Fran: "21-15-9 thrusters and pull-ups". */
public record Wod(String name, String workout) {
    public Wod {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("WOD name is required");
        }
    }
}
