package com.patterns2learn.box.factorymethod.before;

import com.patterns2learn.box.factorymethod.WodPlan;
import com.patterns2learn.box.factorymethod.WodRequest;

/** Before: one service that knows every format, twice over. */
public class SwitchingWodService {
    // @step:switch
    public WodPlan plan(WodRequest r) {
        String movements = String.join(", ", r.movements());
        String summary = switch (r.format()) {                         // switch #1: how to describe it
            case "amrap" -> "AMRAP " + r.minutes() + "': " + movements;
            case "emom" -> "EMOM " + r.minutes() + "': " + movements;
            case "for-time" -> "For time (cap " + r.minutes() + "'): " + movements;
            default -> throw new IllegalArgumentException("unknown format: " + r.format());
        };
        String scoreUnit = switch (r.format()) {                       // switch #2: how to score it
            case "amrap" -> "rounds + reps";
            case "emom" -> "completed minutes";
            case "for-time" -> "seconds";
            default -> throw new IllegalArgumentException("unknown format: " + r.format());
        };
        return new WodPlan(r.name(), r.format(), summary, scoreUnit, r.format().equals("for-time"));
    }
    // @end
}
