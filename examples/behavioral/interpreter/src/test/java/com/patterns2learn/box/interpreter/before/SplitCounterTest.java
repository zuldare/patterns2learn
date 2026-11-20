package com.patterns2learn.box.interpreter.before;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;

class SplitCounterTest {
    @Test void oneLevelWorks() {
        assertThat(new SplitCounter().count("3 x (10 burpees + 15 air-squats)"))
            .containsExactlyInAnyOrderEntriesOf(Map.of("burpees", 30, "air-squats", 45));
    }

    @Test void nestingSilentlyLosesMovements() {
        assertThat(new SplitCounter().count("2 x (3 x (5 pull-ups) + 10 burpees)"))
            .containsExactlyInAnyOrderEntriesOf(Map.of("burpees", 20));   // the 30 pull-ups are gone
    }
}
