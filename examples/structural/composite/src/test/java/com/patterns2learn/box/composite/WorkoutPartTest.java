package com.patterns2learn.box.composite;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;

class WorkoutPartTest {
    final WodLibrary library = new WodLibrary();

    @Test void aLeafKnowsItsOwnNumbers() {
        assertThat(new Movement("pull-ups", 12).reps()).isEqualTo(12);
        assertThat(new Movement("pull-ups", 12).seconds()).isEqualTo(36);
        assertThat(new Run(400).reps()).isZero();
        assertThat(new Run(400).seconds()).isEqualTo(120);
    }

    @Test void murphAddsUpThroughEveryLevel() {
        WorkoutPart murph = library.find("murph").orElseThrow();

        assertThat(murph.reps()).isEqualTo(600);          // 20 × (5 + 10 + 15)
        assertThat(murph.seconds()).isEqualTo(2760);      // 2 runs + 600 reps
        assertThat(murph.lines()).containsExactly(
            "Murph",
            "  Run 1600 m",
            "  20 rounds",
            "    5 pull-ups",
            "    10 push-ups",
            "    15 air squats",
            "  Run 1600 m");
    }

    @Test void helenHasARunInsideEveryRound() {
        WorkoutPart helen = library.find("helen").orElseThrow();
        assertThat(helen.reps()).isEqualTo(99);
        assertThat(helen.seconds()).isEqualTo(657);
        assertThat(helen.lines()).containsExactly("Helen · 3 rounds", "  Run 400 m", "  21 kettlebell swings", "  12 pull-ups");
    }

    @Test void blocksNestAsDeepAsYouLikeWithinTheLimit() {
        WorkoutPart inner = new Block(null, 2, List.of(new Movement("burpees", 5)));
        WorkoutPart outer = new Block("Ladder", 3, List.of(inner, new Run(200)));
        assertThat(outer.reps()).isEqualTo(30);
        assertThat(outer.seconds()).isEqualTo(3 * (30 + 60));
        assertThat(outer.depth()).isEqualTo(2);
    }

    @Test void partsAreValidated() {
        assertThatThrownBy(() -> new Movement(" ", 5)).isInstanceOf(InvalidWorkoutException.class).hasMessage("movement name is required");
        assertThatThrownBy(() -> new Movement("x".repeat(41), 5)).hasMessage("movement name is at most 40 characters");
        assertThatThrownBy(() -> new Movement("burpees", 0)).hasMessage("reps must be between 1 and 500");
        assertThatThrownBy(() -> new Run(50)).hasMessage("run must be between 100 and 10000 m");
        assertThatThrownBy(() -> new Block(null, 0, List.of(new Run(400)))).hasMessage("rounds must be between 1 and 50");
        assertThatThrownBy(() -> new Block(null, 1, List.of())).hasMessage("a block needs 1 to 10 parts");
        assertThatThrownBy(() -> new Block(null, 1, null)).hasMessage("a block needs 1 to 10 parts");
        assertThatThrownBy(() -> new Block(null, 1, Collections.nCopies(11, new Run(400)))).hasMessage("a block needs 1 to 10 parts");
        assertThatThrownBy(() -> new Block(null, 1, java.util.Arrays.asList(new Run(400), null))).hasMessage("a block part cannot be empty");
        assertThatThrownBy(() -> new Block("x".repeat(41), 1, List.of(new Run(400)))).hasMessage("block title is at most 40 characters");
    }

    @Test void oneRoundIsSingular() {
        assertThat(new Block(null, 1, List.of(new Run(400))).lines()).first().isEqualTo("1 round");
    }

    @Test void absurdWorkoutsAreRejectedInsteadOfOverflowing() {
        WorkoutPart big = new Block(null, 7, Collections.nCopies(2, new Movement("burpees", 500)));   // 7000 reps, still fine
        assertThat(big.reps()).isEqualTo(7000);
        assertThatThrownBy(() -> new Block(null, 2, List.of(big))).hasMessage("a WOD can't go over 10000 reps or 6 hours");
        assertThatThrownBy(() -> new Block(null, 50, List.of(new Run(10000)))).hasMessage("a WOD can't go over 10000 reps or 6 hours");
        WorkoutPart d = new Run(400);
        for (int i = 0; i < 4; i++) d = new Block(null, 1, List.of(d));
        WorkoutPart deep = d;
        assertThatThrownBy(() -> new Block(null, 1, List.of(deep))).hasMessage("blocks can nest at most 4 levels");
    }
}
