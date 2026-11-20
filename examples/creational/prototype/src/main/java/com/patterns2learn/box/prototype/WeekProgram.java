package com.patterns2learn.box.prototype;

import java.util.ArrayList;
import java.util.List;

/** A week of programming: a name and its days. Mutable, so the coach can rename it and edit days. */
public class WeekProgram {
    private String name;
    private final List<DayPlan> days;

    public WeekProgram(String name, List<DayPlan> days) {
        rename(name);
        this.days = new ArrayList<>(days);
    }

    // @step:prototype
    /** The prototype's copy: a new week with a copy of every day, not the same days. */
    public WeekProgram copy() {
        List<DayPlan> copied = new ArrayList<>();
        for (DayPlan d : days) copied.add(d.copy());   // deep: each day copies itself
        return new WeekProgram(name, copied);
    }
    // @end

    public WeekProgram rename(String newName) {
        if (newName == null || newName.isBlank()) throw new InvalidProgramException("name is required");
        if (newName.strip().length() > 40) throw new InvalidProgramException("name is at most 40 characters");
        this.name = newName.strip();
        return this;
    }

    public DayPlan day(String day) {
        return days.stream().filter(d -> d.day().equalsIgnoreCase(day == null ? "" : day.strip()))
            .findFirst().orElseThrow(() -> new UnknownDayException(day));
    }

    public String name() { return name; }
    public List<DayPlan> days() { return List.copyOf(days); }
}
