package com.patterns2learn.box.composite.before;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class FlatWodTest {
    final List<FlatMovement> partition = List.of(new FlatMovement("pull-ups", 5), new FlatMovement("push-ups", 10), new FlatMovement("air squats", 15));

    @Test void murphFitsOnlyThanksToTwoBoltedOnFields() {
        FlatWod murph = new FlatWod("Murph", 20, partition, 1600, 1600);
        assertThat(murph.reps()).isEqualTo(600);
        assertThat(murph.seconds()).isEqualTo(2760);
    }

    @Test void helenDoesNotFitTheRunIsInsideEachRound() {
        // the closest the flat model gets: one run before, which is not Helen
        FlatWod notHelen = new FlatWod("Helen", 3, List.of(new FlatMovement("kettlebell swings", 21), new FlatMovement("pull-ups", 12)), 400, 0);
        assertThat(notHelen.seconds()).isEqualTo(417);   // the real Helen takes 657: three runs, not one
    }
}
