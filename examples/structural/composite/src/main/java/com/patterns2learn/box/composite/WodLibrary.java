package com.patterns2learn.box.composite;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

/** The box's benchmark WODs, built as trees of parts. */
@Component
public class WodLibrary {
    // @step:murph
    private static final WorkoutPart MURPH = new Block("Murph", 1, List.of(
        new Run(1600),
        new Block(null, 20, List.of(               // a block inside a block
            new Movement("pull-ups", 5),
            new Movement("push-ups", 10),
            new Movement("air squats", 15))),
        new Run(1600)));
    // @end

    private static final WorkoutPart HELEN = new Block("Helen", 3, List.of(
        new Run(400),
        new Movement("kettlebell swings", 21),
        new Movement("pull-ups", 12)));

    private final Map<String, WorkoutPart> wods = Map.of("murph", MURPH, "helen", HELEN);

    public Optional<WorkoutPart> find(String name) {
        return name == null ? Optional.empty() : Optional.ofNullable(wods.get(name.strip().toLowerCase(Locale.ROOT)));
    }
}
