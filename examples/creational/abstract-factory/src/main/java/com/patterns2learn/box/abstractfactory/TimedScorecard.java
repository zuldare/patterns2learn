package com.patterns2learn.box.abstractfactory;

/** Rx and Scaled: finish and your score is your time; hit the cap and it's the reps you got. */
public record TimedScorecard(String tag, int timeCapMinutes) implements Scorecard {
    @Override
    public String score(int seconds, int reps, int totalReps) {
        if (reps < totalReps) return "CAP + " + reps + " reps " + tag;
        return "%d:%02d %s".formatted(seconds / 60, seconds % 60, tag);
    }
}
