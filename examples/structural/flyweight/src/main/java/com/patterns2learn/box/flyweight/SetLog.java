package com.patterns2learn.box.flyweight;

import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SetLog {
    private final MovementCatalog catalog;
    private final List<LoggedSet> sets = new ArrayList<>();
    private final int capacity;

    @Autowired
    public SetLog(MovementCatalog catalog) {
        this(catalog, 10_000);
    }

    SetLog(MovementCatalog catalog, int capacity) {
        this.catalog = catalog;
        this.capacity = capacity;
    }

    // @step:client
    public synchronized LoggedSet log(String athlete, String movement, int reps, int kg) {
        if (sets.size() >= capacity) throw new LogFullException();          // a demo, not a database
        String who = validate(athlete, reps, kg);
        LoggedSet set = new LoggedSet(who, catalog.get(movement), reps, kg);   // shared + own
        sets.add(set);
        return set;
    }
    // @end

    public synchronized int size() {
        return sets.size();
    }

    public synchronized List<LoggedSet> sets() {
        return List.copyOf(sets);
    }

    private static String validate(String athlete, int reps, int kg) {
        if (athlete == null || athlete.isBlank()) throw new InvalidSetException("athlete is required");
        String who = athlete.strip();
        if (who.length() > 40) throw new InvalidSetException("athlete is at most 40 characters");
        if (reps < 1 || reps > 500) throw new InvalidSetException("reps must be between 1 and 500");
        if (kg < 0 || kg > 500) throw new InvalidSetException("kg must be between 0 and 500");
        return who;
    }
}
