package com.patterns2learn.box.visitor;

import java.util.Set;

public record Cardio(String machine, int meters) implements WorkoutElement {
    private static final Set<String> MACHINES = Set.of("row", "bike", "ski", "run");

    public Cardio {
        machine = machine == null ? "" : machine.strip().toLowerCase(java.util.Locale.ROOT);
        if (!MACHINES.contains(machine)) throw new InvalidElementException("machine must be row, bike, ski or run");
        if (meters < 100 || meters > 10_000) throw new InvalidElementException("distance must be between 100 and 10000 m");
    }

    @Override
    public void accept(WorkoutVisitor<?> visitor) {
        visitor.visitCardio(this);
    }
}
