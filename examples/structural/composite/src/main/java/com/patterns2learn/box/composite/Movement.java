package com.patterns2learn.box.composite;

import java.util.List;

/** A leaf: a number of reps of one movement. The estimate counts 3 seconds per rep. */
public record Movement(String name, int reps) implements WorkoutPart {
    static final int SECONDS_PER_REP = 3;

    public Movement {
        if (name == null || name.isBlank()) throw new InvalidWorkoutException("movement name is required");
        name = name.strip();
        if (name.length() > 40) throw new InvalidWorkoutException("movement name is at most 40 characters");
        if (reps < 1 || reps > 500) throw new InvalidWorkoutException("reps must be between 1 and 500");
    }

    // @step:leaf
    @Override
    public int seconds() {
        return reps * SECONDS_PER_REP;
    }

    @Override
    public List<String> lines() {
        return List.of(reps + " " + name);
    }
    // @end
}
