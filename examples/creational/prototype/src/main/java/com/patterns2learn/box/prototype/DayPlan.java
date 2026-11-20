package com.patterns2learn.box.prototype;

import java.util.ArrayList;
import java.util.List;

/** One day of a week's programming. Mutable: the coach edits it. */
public class DayPlan {
    private final String day;
    private final List<String> movements = new ArrayList<>();

    public DayPlan(String day, List<String> movements) {
        this.day = day;
        replace(movements);
    }

    // @step:day-copy
    /** A copy with its own list of movements, so editing one never touches the other. */
    public DayPlan copy() {
        return new DayPlan(day, movements);    // the constructor copies the list
    }
    // @end

    public void replace(List<String> newMovements) {
        if (newMovements == null || newMovements.isEmpty() || newMovements.size() > 12) {
            throw new InvalidProgramException("a day needs 1 to 12 movements");
        }
        List<String> cleaned = new ArrayList<>();
        for (String m : newMovements) {
            if (m == null || m.isBlank()) throw new InvalidProgramException("movements cannot be blank");
            if (m.strip().length() > 60) throw new InvalidProgramException("a movement is at most 60 characters");
            cleaned.add(m.strip());
        }
        movements.clear();
        movements.addAll(cleaned);
    }

    public String day() { return day; }
    public List<String> movements() { return List.copyOf(movements); }
}
