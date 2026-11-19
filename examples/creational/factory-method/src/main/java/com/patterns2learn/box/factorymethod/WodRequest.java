package com.patterns2learn.box.factorymethod;

import java.util.List;

/** What the coach asks for: a name, a format and the work itself. */
public record WodRequest(String name, String format, int minutes, List<String> movements) {
    public WodRequest {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("name is required");
        if (format == null || format.isBlank()) throw new IllegalArgumentException("format is required");
        if (minutes < 1 || minutes > 90) throw new IllegalArgumentException("minutes must be between 1 and 90");
        if (movements == null || movements.isEmpty()) throw new IllegalArgumentException("at least one movement is required");
        if (movements.size() > 20) throw new IllegalArgumentException("at most 20 movements");
        if (movements.stream().anyMatch(m -> m == null || m.isBlank())) throw new IllegalArgumentException("movements cannot be blank");
        movements = List.copyOf(movements);
    }
}
