package com.patterns2learn.box.abstractfactory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class FranPlannerTest {
    final FranPlanner planner = new FranPlanner();

    @Test void anRxCardUsesOnlyRxPieces() {
        WodCard card = planner.plan(new RxKit());
        assertThat(card.lines()).containsExactly("21-15-9", "thrusters 43 kg", "pull-ups");
        assertThat(card.title()).isEqualTo("Fran · Rx");
        assertThat(card.timeCapMinutes()).isEqualTo(10);
    }

    @Test void everyKitBringsAConsistentFamily() {
        assertThat(planner.plan(new ScaledKit()))
            .isEqualTo(new WodCard("Fran · Scaled", List.of("21-15-9", "thrusters 29 kg", "jumping pull-ups"), 12));
        assertThat(planner.plan(new TeensKit()))
            .isEqualTo(new WodCard("Fran · Teens", List.of("21-15-9", "thrusters 20 kg", "ring rows"), 12));
    }

    @Test void eachFamilyScoresItsOwnWay() {
        // @step:scoring
        assertThat(planner.score(new RxKit(), 185, 90)).isEqualTo("3:05 Rx");             // finished: time
        assertThat(planner.score(new RxKit(), 600, 72)).isEqualTo("CAP + 72 reps Rx");     // capped: reps
        assertThat(planner.score(new TeensKit(), 412, 90)).isEqualTo("90 reps Teens");     // teens: always reps
        // @end
        assertThat(planner.score(new ScaledKit(), 250, 90)).isEqualTo("4:10 Scaled");
    }

    @Test void resultsOutsideTheWodAreRejected() {
        assertThatThrownBy(() -> planner.score(new RxKit(), 700, 90)).hasMessage("time must be between 1 and 600 seconds");
        assertThatThrownBy(() -> planner.score(new RxKit(), 100, 91)).hasMessage("reps must be between 0 and 90");
    }

    @Test void productsValidateThemselves() {
        assertThatThrownBy(() -> new Barbell(0)).hasMessage("load must be between 1 and 200 kg");
        assertThatThrownBy(() -> new PullVariant(" ")).hasMessage("pull variant is required");
    }
}
