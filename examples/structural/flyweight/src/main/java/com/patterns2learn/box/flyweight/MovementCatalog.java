package com.patterns2learn.box.flyweight;

import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

/** The flyweight factory: one Movement per name, created the first time it's asked for and shared afterwards. */
@Component
public class MovementCatalog {
    private final Map<String, Movement> pool = new ConcurrentHashMap<>();
    private final AtomicInteger created = new AtomicInteger();

    // @step:factory
    public Movement get(String name) {
        if (name == null || name.isBlank()) throw new InvalidSetException("movement is required");
        String key = name.strip().toLowerCase(Locale.ROOT);
        return pool.computeIfAbsent(key, this::load);      // the same instance, every time
    }

    private Movement load(String key) {
        Movement m = MovementDefinitions.ALL.get(key);
        if (m == null) throw new UnknownMovementException(abbreviate(key));
        created.incrementAndGet();
        return new Movement(m.name(), m.category(), m.standard(), m.equipment());
    }
    // @end

    /** How many Movement objects exist, however many sets point to them. */
    public int created() {
        return created.get();
    }

    private static String abbreviate(String s) {
        return s.length() <= 20 ? s : s.substring(0, 20) + "…";
    }
}
