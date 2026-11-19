package com.patterns2learn.box.singleton;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

// @step:catalog-bean
@Component
public class WodCatalog {
    private final Map<String, Wod> wods = new ConcurrentHashMap<>();

    public WodCatalog() {
        wods.put("Fran", new Wod("Fran", "21-15-9 thrusters and pull-ups"));
        wods.put("Cindy", new Wod("Cindy", "20-minute AMRAP: 5 pull-ups, 10 push-ups, 15 air squats"));
    }

    public Optional<Wod> find(String name) {
        return Optional.ofNullable(wods.get(name));
    }
    // @end

    public List<Wod> all() {
        return wods.values().stream().sorted(Comparator.comparing(Wod::name)).toList();
    }

    // @step:thread-safe
    public void add(Wod wod) {
        // putIfAbsent on a ConcurrentHashMap checks and inserts in one atomic step:
        // two coaches adding WODs at the same time never overwrite each other
        if (wods.putIfAbsent(wod.name(), wod) != null) {
            throw new DuplicateWodException(wod.name());
        }
    }
    // @end
}
