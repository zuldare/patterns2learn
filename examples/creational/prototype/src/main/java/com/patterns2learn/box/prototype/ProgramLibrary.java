package com.patterns2learn.box.prototype;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.stereotype.Component;

/** The prototype registry: named templates. It only ever hands out copies. */
@Component
public class ProgramLibrary {
    /** Read-only after construction: the prototypes themselves are never handed out or changed. */
    private final Map<String, WeekProgram> prototypes = java.util.Collections.unmodifiableMap(new TreeMap<>(Map.of(
        "strength-block", new WeekProgram("Strength block", List.of(
            new DayPlan("Mon", List.of("5x5 deadlift", "Fran")),
            new DayPlan("Tue", List.of("10' row", "skill: handstands")),
            new DayPlan("Wed", List.of("5x5 back squat", "3 rounds Helen")),
            new DayPlan("Thu", List.of("active recovery")),
            new DayPlan("Fri", List.of("5x5 press", "Cindy")))),
        "deload-week", new WeekProgram("Deload week", List.of(
            new DayPlan("Mon", List.of("20' easy row", "mobility")),
            new DayPlan("Wed", List.of("technique: cleans")),
            new DayPlan("Fri", List.of("partner WOD, light")))))));

    // @step:registry
    public WeekProgram newWeek(String template, String name) {
        return prototype(template).copy().rename(name);   // copy the template, then customise the copy
    }
    // @end

    /** A copy of a template as it is, to look at it. */
    public WeekProgram template(String template) {
        return prototype(template).copy();
    }

    public List<String> names() {
        return List.copyOf(prototypes.keySet());
    }

    private WeekProgram prototype(String template) {
        WeekProgram p = template == null ? null : prototypes.get(template.strip());
        if (p == null) throw new UnknownTemplateException(template == null ? "" : abbreviate(template.strip()));
        return p;
    }

    private static String abbreviate(String s) {
        return s.length() <= 40 ? s : s.substring(0, 40) + "…";
    }
}
