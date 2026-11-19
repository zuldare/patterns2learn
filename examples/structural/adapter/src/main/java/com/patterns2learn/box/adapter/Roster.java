package com.patterns2learn.box.adapter;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

/** The box's athletes (in-memory for the example). */
@Component
public class Roster {
    private final Map<String, Athlete> athletes = Map.of(
        "ana", new Athlete("ana", "Ana", 190),
        "leo", new Athlete("leo", "Leo", 185));

    public Optional<Athlete> find(String id) {
        return id == null ? Optional.empty() : Optional.ofNullable(athletes.get(id.strip().toLowerCase(Locale.ROOT)));
    }
}
