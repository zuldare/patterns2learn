package com.patterns2learn.box.mediator;

// @step:mediator
/** The mediator: devices tell it what happened; it decides what everyone else does. */
public interface FloorMediator {
    void timerStarted();
    void athleteFinished(String athlete, int seconds);
    void capReached();
}
// @end
