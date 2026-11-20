package com.patterns2learn.box.visitor;

public record Lift(String name, int kg, int reps) implements WorkoutElement {
    public Lift {
        if (name == null || name.isBlank()) throw new InvalidElementException("lift name is required");
        name = name.strip();
        if (name.length() > 40) throw new InvalidElementException("lift name is at most 40 characters");
        if (kg < 1 || kg > 300) throw new InvalidElementException("load must be between 1 and 300 kg");
        if (reps < 1 || reps > 300) throw new InvalidElementException("reps must be between 1 and 300");
    }

    // @step:accept
    @Override
    public void accept(WorkoutVisitor<?> visitor) {
        visitor.visitLift(this);       // "I'm a Lift": the visitor runs its Lift code
    }
    // @end
}
