package com.patterns2learn.box.interpreter;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/** The context the expressions write into: reps per movement, in the order they first appear. */
public class Tally {
    static final long MAX_REPS = 100_000;

    private final Map<String, Integer> totals = new LinkedHashMap<>();
    private long reps;

    void add(String movement, long n) {
        if (n > MAX_REPS || reps + n > MAX_REPS) throw new InvalidWodException("the workout adds up to more than " + MAX_REPS + " reps");
        reps += n;
        totals.merge(movement, (int) n, Integer::sum);
    }

    public Map<String, Integer> totals() {
        return Collections.unmodifiableMap(new LinkedHashMap<>(totals));
    }

    public int reps() {
        return (int) reps;
    }
}
