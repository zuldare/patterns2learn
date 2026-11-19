package com.patterns2learn.box.abstractfactory;

// @step:scorecard
/** Abstract product: how a division tags, caps and scores the WOD. Each family scores its own way. */
public interface Scorecard {
    String tag();
    int timeCapMinutes();
    String score(int seconds, int reps, int totalReps);
}
// @end
