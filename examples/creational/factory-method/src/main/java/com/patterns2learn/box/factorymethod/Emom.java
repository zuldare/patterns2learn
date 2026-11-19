package com.patterns2learn.box.factorymethod;

import java.util.List;

/** Every minute on the minute: the work starts again each minute. */
public record Emom(int minutes, List<String> movements) implements Workout {
    public String summary() {
        return "EMOM " + minutes + "': " + String.join(", ", movements);
    }

    public String scoreUnit() {
        return "completed minutes";
    }

    public boolean lowerIsBetter() {
        return false;
    }
}
