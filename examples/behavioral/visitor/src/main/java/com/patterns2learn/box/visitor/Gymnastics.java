package com.patterns2learn.box.visitor;

public record Gymnastics(String name, int reps) implements WorkoutElement {
    public Gymnastics {
        if (name == null || name.isBlank()) throw new InvalidElementException("movement name is required");
        name = name.strip();
        if (name.length() > 40) throw new InvalidElementException("movement name is at most 40 characters");
        if (reps < 1 || reps > 300) throw new InvalidElementException("reps must be between 1 and 300");
    }

    @Override
    public void accept(WorkoutVisitor<?> visitor) {
        visitor.visitGymnastics(this);
    }
}
