package com.patterns2learn.box.flyweight;

import java.util.List;

// @step:flyweight
/** The flyweight: what every set of a movement has in common. Immutable, so it's safe to share. */
public record Movement(String name, String category, String standard, List<String> equipment) {
    public Movement {
        equipment = List.copyOf(equipment);
    }

    /** The extrinsic state (who, how many, how heavy) comes in from outside; it's never stored here. */
    public String line(String athlete, int reps, int kg) {
        String base = athlete + " · " + reps + " × " + name;
        return kg == 0 ? base : base + " @ " + kg + " kg";
    }
}
// @end
