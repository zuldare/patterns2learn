package com.patterns2learn.box.flyweight;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.Set;
import org.junit.jupiter.api.Test;

class MovementCatalogTest {
    @Test void thousandsOfSetsShareAHandfulOfMovements() {
        // @step:share
        MovementCatalog catalog = new MovementCatalog();
        SetLog log = new SetLog(catalog);
        for (int i = 0; i < 3_000; i++) {
            log.log("athlete-" + i, i % 2 == 0 ? "back squat" : "deadlift", 5, 100);
        }
        assertThat(log.size()).isEqualTo(3_000);
        assertThat(catalog.created()).isEqualTo(2);       // two Movement objects for 3,000 sets
        // @end
        Set<Movement> distinct = Collections.newSetFromMap(new IdentityHashMap<>());
        log.sets().forEach(s -> distinct.add(s.movement()));
        assertThat(distinct).hasSize(2);
    }

    @Test void theCatalogHandsBackTheSameInstance() {
        MovementCatalog catalog = new MovementCatalog();
        assertThat(catalog.get("Back Squat")).isSameAs(catalog.get("  back squat "));
        assertThat(catalog.get("thruster").equipment()).containsExactly("barbell");
        assertThatThrownBy(() -> catalog.get("burpee kip")).isInstanceOf(UnknownMovementException.class).hasMessage("unknown movement: burpee kip");
        assertThatThrownBy(() -> catalog.get(null)).isInstanceOf(InvalidSetException.class).hasMessage("movement is required");
    }

    @Test void theExtrinsicStateTravelsWithEachSet() {
        // @step:extrinsic
        SetLog log = new SetLog(new MovementCatalog());
        LoggedSet ana = log.log("Ana", "back squat", 5, 100);
        LoggedSet leo = log.log("Leo", "back squat", 3, 120);

        assertThat(ana.movement()).isSameAs(leo.movement());              // shared: the intrinsic state
        assertThat(ana.line()).isEqualTo("Ana · 5 × back squat @ 100 kg");
        assertThat(leo.line()).isEqualTo("Leo · 3 × back squat @ 120 kg"); // own: athlete, reps, kg
        // @end
        assertThat(log.log("Eva", "pull-up", 10, 0).line()).isEqualTo("Eva · 10 × pull-up");
    }

    @Test void setsAreValidated() {
        SetLog log = new SetLog(new MovementCatalog());
        assertThatThrownBy(() -> log.log(" ", "deadlift", 5, 100)).isInstanceOf(InvalidSetException.class).hasMessage("athlete is required");
        assertThatThrownBy(() -> log.log("Ana", "deadlift", 0, 100)).hasMessage("reps must be between 1 and 500");
        assertThatThrownBy(() -> log.log("Ana", "deadlift", 5, -1)).hasMessage("kg must be between 0 and 500");
        assertThatThrownBy(() -> log.log("x".repeat(41), "deadlift", 5, 100)).hasMessage("athlete is at most 40 characters");
        SetLog small = new SetLog(new MovementCatalog(), 1);
        small.log("Ana", "deadlift", 5, 100);
        assertThatThrownBy(() -> small.log("Leo", "deadlift", 5, 100)).isInstanceOf(LogFullException.class).hasMessage("the log is full");
    }
}
