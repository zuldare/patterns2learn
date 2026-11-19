package com.patterns2learn.box.abstractfactory.before;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class IfElseFranPlannerTest {
    final IfElseFranPlanner planner = new IfElseFranPlanner();

    @Test void itWorksWhenEveryoneWritesTheDivisionTheSameWay() {
        assertThat(planner.plan("rx")).containsExactly("Fran · Rx", "thrusters 43 kg", "pull-ups", "cap 10'");
    }

    @Test void oneIfThatComparesDifferentlyMixesTwoFamilies() {
        // "RX" passes the case-insensitive weight check but not the tag check
        assertThat(planner.plan("RX")).containsExactly("Fran · Scaled", "thrusters 43 kg", "pull-ups", "cap 10'");
    }
}
