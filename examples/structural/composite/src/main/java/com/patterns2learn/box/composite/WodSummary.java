package com.patterns2learn.box.composite;

import java.util.List;

/** What the board shows: the lines, the total reps and the estimate rounded to minutes. */
public record WodSummary(List<String> board, int reps, int minutes) {
    public static WodSummary of(WorkoutPart wod) {
        return new WodSummary(wod.lines(), wod.reps(), Math.round(wod.seconds() / 60f));
    }
}
