package com.patterns2learn.box.mediator.devices;

import com.patterns2learn.box.mediator.FloorMediator;
import org.springframework.stereotype.Component;

/** A colleague: the timer only tells the floor when it starts and when the cap arrives. */
@Component
public class WodTimer {
    private final FloorMediator floor;

    public WodTimer(FloorMediator floor) {
        this.floor = floor;
    }

    // @step:colleague
    public void start() {
        floor.timerStarted();        // no music, no screen: just "I started"
    }

    public void cap() {
        floor.capReached();
    }
    // @end
}
