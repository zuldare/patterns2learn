package com.patterns2learn.box.abstractfactory;

/** Teens: the class scores reps inside the cap, never time, so nobody rushes the barbell. */
public record TeensScorecard(int timeCapMinutes) implements Scorecard {
    @Override
    public String tag() {
        return "Teens";
    }

    @Override
    public String score(int seconds, int reps, int totalReps) {
        return reps + " reps Teens";
    }
}
