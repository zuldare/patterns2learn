package com.patterns2learn.box.singleton.before;

import com.patterns2learn.box.singleton.Wod;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Before: a plain class that anyone can instantiate, and everyone does. */
public class NaiveWodCatalog {
    private final Map<String, Wod> wods = new HashMap<>();

    public NaiveWodCatalog() {
        // imagine this reads a big file or hits the database: it runs once per `new`
        wods.put("Fran", new Wod("Fran", "21-15-9 thrusters and pull-ups"));
        wods.put("Cindy", new Wod("Cindy", "20-minute AMRAP: 5 pull-ups, 10 push-ups, 15 air squats"));
    }

    public List<Wod> all() {
        return List.copyOf(wods.values());
    }

    public boolean contains(String name) {
        return wods.containsKey(name);
    }

    public void add(Wod wod) {
        wods.put(wod.name(), wod);
    }
}
