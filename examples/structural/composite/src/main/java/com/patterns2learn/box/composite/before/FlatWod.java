package com.patterns2learn.box.composite.before;

import java.util.List;

/** Before: a WOD is "N rounds of these movements", plus whatever fields the last WOD needed. */
public record FlatWod(String name, int rounds, List<FlatMovement> movements, int runBeforeMeters, int runAfterMeters) {
    // @step:flat
    public int reps() {
        int perRound = 0;
        for (FlatMovement m : movements) perRound += m.reps();
        return rounds * perRound;
    }

    public int seconds() {
        int perRound = 0;
        for (FlatMovement m : movements) perRound += m.reps() * 3;
        int runs = (runBeforeMeters + runAfterMeters) * 300 / 1000;   // bolted on for Murph
        return rounds * perRound + runs;                              // a run inside each round? no way to say it
    }
    // @end
}
