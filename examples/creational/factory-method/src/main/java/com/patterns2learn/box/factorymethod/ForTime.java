package com.patterns2learn.box.factorymethod;

import java.util.List;

/** Finish the work as fast as you can, within a time cap. */
public record ForTime(int capMinutes, List<String> movements) implements Workout {
    public String summary() {
        return "For time (cap " + capMinutes + "'): " + String.join(", ", movements);
    }

    public String scoreUnit() {
        return "seconds (reps if you hit the cap)";
    }

    public boolean lowerIsBetter() {
        return true;
    }
}
