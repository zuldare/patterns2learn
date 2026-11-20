package com.patterns2learn.box.flyweight.before;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Before: each set is logged with a fresh copy of the movement's data, read from the "database" again. */
public class CopiedMovementLog {
    private static final Map<String, String[]> ROWS = Map.of(
        "back squat", new String[] {"weightlifting",
            "Bar on the back, hip crease below the top of the knee at the bottom, full hip and knee extension at the top."},
        "deadlift", new String[] {"weightlifting",
            "Bar starts on the floor, finishes with hips and knees fully extended and shoulders behind the bar."});

    private final List<CopiedSet> sets = new ArrayList<>();

    // @step:copies
    public void log(String athlete, String movement, int reps, int kg) {
        String[] row = ROWS.get(movement);
        // every set gets strings with their own characters, like a denormalized query or a JSON import
        sets.add(new CopiedSet(athlete, reps, kg, own(movement), own(row[0]),
                               own(row[1]), List.of(own("barbell"))));
    }
    // @end

    private static String own(String s) {
        return new String(s.toCharArray());     // new String(s) alone would share s's characters
    }

    public List<CopiedSet> sets() {
        return List.copyOf(sets);
    }

    /** Characters across all the copies of the standard text (each copy has its own). */
    public long charsInCopies() {
        return sets.stream().mapToLong(s -> s.standard().length()).sum();
    }
}
