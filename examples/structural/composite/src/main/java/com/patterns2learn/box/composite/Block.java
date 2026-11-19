package com.patterns2learn.box.composite;

import java.util.ArrayList;
import java.util.List;

/** The composite: some rounds of other parts, which may be blocks themselves. */
public record Block(String title, int times, List<WorkoutPart> parts) implements WorkoutPart {
    public Block {
        if (title != null) {
            title = title.isBlank() ? null : title.strip();
            if (title != null && title.length() > 40) throw new IllegalArgumentException("block title is at most 40 characters");
        }
        if (times < 1 || times > 50) throw new IllegalArgumentException("rounds must be between 1 and 50");
        if (parts == null || parts.isEmpty() || parts.size() > 10) throw new IllegalArgumentException("a block needs 1 to 10 parts");
        if (parts.stream().anyMatch(p -> p == null)) throw new IllegalArgumentException("a block part cannot be empty");
        parts = List.copyOf(parts);
        if (1 + parts.stream().mapToInt(WorkoutPart::depth).max().orElse(0) > 4) {
            throw new IllegalArgumentException("blocks can nest at most 4 levels");
        }
        long reps = times * parts.stream().mapToLong(WorkoutPart::reps).sum();
        long seconds = times * parts.stream().mapToLong(WorkoutPart::seconds).sum();
        if (reps > 10_000 || seconds > 6 * 3600) throw new IllegalArgumentException("a WOD can't go over 10000 reps or 6 hours");
    }

    // @step:composite
    @Override
    public int reps() {
        return times * parts.stream().mapToInt(WorkoutPart::reps).sum();   // ask every child
    }

    @Override
    public int seconds() {
        return times * parts.stream().mapToInt(WorkoutPart::seconds).sum();
    }

    @Override
    public List<String> lines() {
        List<String> lines = new ArrayList<>();
        lines.add(header());
        for (WorkoutPart p : parts) {
            p.lines().forEach(line -> lines.add("  " + line));   // one level deeper
        }
        return lines;
    }
    // @end

    @Override
    public int depth() {
        return 1 + parts.stream().mapToInt(WorkoutPart::depth).max().orElse(0);
    }

    private String header() {
        if (title == null) return times + " rounds";
        return times > 1 ? title + " · " + times + " rounds" : title;
    }
}
