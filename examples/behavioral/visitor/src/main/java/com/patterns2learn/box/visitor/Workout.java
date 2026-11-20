package com.patterns2learn.box.visitor;

import java.util.List;

/** The object structure: the workout's elements, walked once for any visitor. */
public record Workout(List<WorkoutElement> elements) {
    public Workout {
        if (elements == null || elements.isEmpty() || elements.size() > 20) {
            throw new InvalidElementException("a workout needs 1 to 20 elements");
        }
        if (elements.stream().anyMatch(e -> e == null)) throw new InvalidElementException("elements cannot be empty");
        elements = List.copyOf(elements);
    }

    public <R> R visit(WorkoutVisitor<R> visitor) {
        for (WorkoutElement e : elements) e.accept(visitor);
        return visitor.result();
    }
}
