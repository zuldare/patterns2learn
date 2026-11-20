package com.patterns2learn.box.visitor;

import java.util.List;

/** The same operation in modern Java: a switch over the sealed interface, checked by the compiler. */
public final class PatternMatchingCalories {
    private PatternMatchingCalories() {}

    // @step:sealed
    public static int of(List<WorkoutElement> elements) {
        int calories = 0;
        for (WorkoutElement e : elements) {
            calories += switch (e) {                       // no default: if a new kind appears,
                case Lift l -> l.reps() * 2;               // this stops compiling until it's handled
                case Gymnastics g -> g.reps() * 2 / 5;
                case Cardio c -> c.meters() * 6 / 100;
            };
        }
        return calories;
    }
    // @end
}
