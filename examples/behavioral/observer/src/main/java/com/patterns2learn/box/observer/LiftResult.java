package com.patterns2learn.box.observer;

/** A logged lift, e.g. Ana, Back squat, 105 kg. */
public record LiftResult(String athlete, String lift, int kg) {
    public LiftResult {
        if (athlete == null || athlete.isBlank()) throw new IllegalArgumentException("athlete is required");
        if (lift == null || lift.isBlank()) throw new IllegalArgumentException("lift is required");
        if (kg <= 0) throw new IllegalArgumentException("kg must be > 0");
    }
}
