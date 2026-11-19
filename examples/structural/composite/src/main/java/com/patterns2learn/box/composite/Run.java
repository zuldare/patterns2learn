package com.patterns2learn.box.composite;

import java.util.List;

/** Another leaf: a run, at 5 minutes per km for the estimate. It adds time, not reps. */
public record Run(int meters) implements WorkoutPart {
    public Run {
        if (meters < 100 || meters > 10_000) throw new IllegalArgumentException("run must be between 100 and 10000 m");
    }

    @Override
    public int reps() {
        return 0;
    }

    @Override
    public int seconds() {
        return meters * 300 / 1000;
    }

    @Override
    public List<String> lines() {
        return List.of("Run " + meters + " m");
    }
}
