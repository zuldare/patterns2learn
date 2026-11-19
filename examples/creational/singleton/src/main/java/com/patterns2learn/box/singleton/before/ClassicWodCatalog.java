package com.patterns2learn.box.singleton.before;

import com.patterns2learn.box.singleton.DuplicateWodException;
import com.patterns2learn.box.singleton.Wod;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/** Before (GoF style): the class itself guarantees there is only one instance. */
// @step:classic
public final class ClassicWodCatalog {
    private final Map<String, Wod> wods = new ConcurrentHashMap<>();

    private ClassicWodCatalog() {
        wods.put("Fran", new Wod("Fran", "21-15-9 thrusters and pull-ups"));
        wods.put("Cindy", new Wod("Cindy", "20-minute AMRAP: 5 pull-ups, 10 push-ups, 15 air squats"));
    }

    private static final class Holder {
        // the JVM creates it lazily and thread-safely, the first time Holder is touched
        private static final ClassicWodCatalog INSTANCE = new ClassicWodCatalog();
    }

    public static ClassicWodCatalog getInstance() {
        return Holder.INSTANCE;
    }
    // @end

    public Optional<Wod> find(String name) {
        return Optional.ofNullable(wods.get(name));
    }

    public void add(Wod wod) {
        if (wods.putIfAbsent(wod.name(), wod) != null) {
            throw new DuplicateWodException(wod.name());
        }
    }
}
