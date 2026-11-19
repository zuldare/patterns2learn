package com.patterns2learn.box.adapter;

/** Training zones 1–5 as a percentage of the athlete's max heart rate. */
public final class Zone {
    private Zone() {}

    public static int of(int bpm, int maxHr) {
        int pct = bpm * 100 / maxHr;
        if (pct < 60) return 1;
        if (pct < 70) return 2;
        if (pct < 80) return 3;
        if (pct < 90) return 4;
        return 5;
    }
}
