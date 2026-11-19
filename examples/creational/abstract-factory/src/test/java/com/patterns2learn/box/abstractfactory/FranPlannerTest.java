package com.patterns2learn.box.abstractfactory;

import static org.assertj.core.api.Assertions.assertThat;

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
            .isEqualTo(new WodCard("Fran · Scaled", java.util.List.of("21-15-9", "thrusters 29 kg", "jumping pull-ups"), 12));
        assertThat(planner.plan(new TeensKit()))
            .isEqualTo(new WodCard("Fran · Teens", java.util.List.of("21-15-9", "thrusters 20 kg", "ring rows"), 12));
    }
}
