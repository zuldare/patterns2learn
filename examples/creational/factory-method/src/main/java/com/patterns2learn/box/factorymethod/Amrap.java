package com.patterns2learn.box.factorymethod;

import java.util.List;

/** As many rounds as possible in a fixed time. */
public record Amrap(int minutes, List<String> movements) implements Workout {
    public String summary() {
        return "AMRAP " + minutes + "': " + String.join(", ", movements);
    }

    public String scoreUnit() {
        return "rounds + reps";
    }

    public boolean lowerIsBetter() {
        return false;
    }
}
