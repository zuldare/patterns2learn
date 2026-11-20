package com.patterns2learn.box.visitor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class VisitorTest {
    final List<WorkoutElement> fran = List.of(new Lift("thrusters", 43, 45), new Gymnastics("pull-ups", 45));
    final List<WorkoutElement> mixed = List.of(new Lift("deadlift", 100, 15), new Cardio("row", 1000), new Gymnastics("burpees", 30));

    @Test void eachOperationIsOneVisitor() {
        Workout wod = new Workout(mixed);

        assertThat(wod.visit(new EquipmentVisitor())).containsExactly("barbell + plates", "rower");
        assertThat(wod.visit(new CalorieVisitor())).isEqualTo(102);   // 30 + 60 + 12
        assertThat(new Workout(fran).visit(new EquipmentVisitor())).containsExactly("barbell + plates", "pull-up bar");
    }

    @Test void theSealedSwitchGivesTheSameAnswers() {
        assertThat(PatternMatchingCalories.of(mixed)).isEqualTo(new Workout(mixed).visit(new CalorieVisitor()));
        assertThat(PatternMatchingCalories.of(fran)).isEqualTo(new Workout(fran).visit(new CalorieVisitor()));
    }

    @Test void elementsAreValidated() {
        assertThatThrownBy(() -> new Lift(" ", 40, 5)).isInstanceOf(InvalidElementException.class).hasMessage("lift name is required");
        assertThatThrownBy(() -> new Lift("snatch", 0, 5)).hasMessage("load must be between 1 and 300 kg");
        assertThatThrownBy(() -> new Lift("snatch", 40, 0)).hasMessage("reps must be between 1 and 300");
        assertThatThrownBy(() -> new Gymnastics("burpees", 301)).hasMessage("reps must be between 1 and 300");
        assertThatThrownBy(() -> new Cardio("swim", 500)).hasMessage("machine must be row, bike, ski or run");
        assertThatThrownBy(() -> new Cardio("row", 50)).hasMessage("distance must be between 100 and 10000 m");
        assertThatThrownBy(() -> new Workout(List.of())).hasMessage("a workout needs 1 to 20 elements");
        assertThatThrownBy(() -> new Workout(java.util.Arrays.asList(new Gymnastics("burpees", 10), null))).hasMessage("elements cannot be empty");
    }
}
