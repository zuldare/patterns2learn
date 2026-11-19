package com.patterns2learn.box.mediator.devices;

import com.patterns2learn.box.mediator.FloorMediator;
import com.patterns2learn.box.mediator.InvalidFinishException;
import org.springframework.stereotype.Component;

/** Another colleague: the mat athletes step on when they finish. */
@Component
public class FinishLine {
    private final FloorMediator floor;

    public FinishLine(FloorMediator floor) {
        this.floor = floor;
    }

    public void finish(String athlete, int seconds) {
        if (athlete == null || athlete.isBlank()) throw new InvalidFinishException("athlete is required");
        String name = athlete.strip();
        if (name.length() > 40) throw new InvalidFinishException("athlete is at most 40 characters");
        if (seconds < 1 || seconds > 3600) throw new InvalidFinishException("time must be between 1 and 3600 seconds");
        floor.athleteFinished(name, seconds);
    }
}
