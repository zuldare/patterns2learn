package com.patterns2learn.box.observer;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class LeaderboardListener {
    private final Map<String, Map<String, Integer>> byLift = new ConcurrentHashMap<>();

    // @step:listeners
    @EventListener
    public void on(PersonalRecordEvent e) {
        byLift.computeIfAbsent(e.lift(), lift -> new ConcurrentHashMap<>()).merge(e.athlete(), e.kg(), Math::max);
    }
    // @end

    /** Athletes of one lift, heaviest first. */
    public Map<String, Integer> top(String lift) {
        Map<String, Integer> sorted = new LinkedHashMap<>();
        byLift.getOrDefault(lift, Map.of()).entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue(Comparator.reverseOrder()).thenComparing(Map.Entry.comparingByKey()))
            .forEach(en -> sorted.put(en.getKey(), en.getValue()));
        return sorted;
    }
}
