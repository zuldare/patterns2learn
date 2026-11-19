package com.patterns2learn.box.observer;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class BadgeListener {
    private final ConcurrentHashMap<String, Set<String>> badges = new ConcurrentHashMap<>();

    @EventListener
    public void on(PersonalRecordEvent e) {
        badges.computeIfAbsent(e.athlete(), a -> ConcurrentHashMap.newKeySet()).add("PR club");
    }

    public Set<String> badgesOf(String athlete) {
        return Set.copyOf(badges.getOrDefault(athlete, Set.of()));
    }
}
