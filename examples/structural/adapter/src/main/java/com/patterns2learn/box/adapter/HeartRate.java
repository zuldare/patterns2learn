package com.patterns2learn.box.adapter;

import java.time.Instant;

/** A heart rate in the box's own terms: beats per minute and when it was taken. */
public record HeartRate(int bpm, Instant at) {
    public HeartRate {
        if (!plausible(bpm)) throw new IllegalArgumentException("bpm must be between 20 and 250");
        if (at == null) throw new IllegalArgumentException("time is required");
    }

    public static boolean plausible(int bpm) {
        return bpm >= 20 && bpm <= 250;
    }
}
