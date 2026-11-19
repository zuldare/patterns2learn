package com.patterns2learn.box.observer;

/** A logged lift, e.g. Ana, Back squat, 105 kg. */
public record LiftResult(String athlete, String lift, int kg) {
    public static final int MAX_NAME = 80;
    public static final int MAX_KG = 1000;

    public LiftResult {
        if (athlete == null || athlete.isBlank()) throw new IllegalArgumentException("athlete is required");
        if (athlete.length() > MAX_NAME) throw new IllegalArgumentException("athlete is too long (max " + MAX_NAME + ")");
        if (lift == null || lift.isBlank()) throw new IllegalArgumentException("lift is required");
        if (lift.length() > MAX_NAME) throw new IllegalArgumentException("lift is too long (max " + MAX_NAME + ")");
        if (kg <= 0) throw new IllegalArgumentException("kg must be > 0");
        if (kg > MAX_KG) throw new IllegalArgumentException("kg must be <= " + MAX_KG);
    }
}
