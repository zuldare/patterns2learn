package com.patterns2learn.box.singleton;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;

class WodCatalogTest {
    private static final Wod MURPH = new Wod("Murph", "1 mile run, 100 pull-ups, 200 push-ups, 300 squats, 1 mile run");
    private final WodCatalog catalog = new WodCatalog();

    @Test void startsWithTheBenchmarkGirlsSortedByName() {
        assertThat(catalog.all()).extracting(Wod::name).containsExactly("Cindy", "Fran");
        assertThat(catalog.find("Fran")).hasValueSatisfying(w -> assertThat(w.workout()).isEqualTo("21-15-9 thrusters and pull-ups"));
    }

    @Test void addsANewWod() {
        catalog.add(MURPH);
        assertThat(catalog.find("Murph")).contains(MURPH);
    }

    @Test void refusesDuplicatesWithoutOverwriting() {
        assertThatThrownBy(() -> catalog.add(new Wod("Fran", "something else")))
            .isInstanceOf(DuplicateWodException.class)
            .hasMessage("WOD already exists: Fran");
        assertThat(catalog.find("Fran").orElseThrow().workout()).isEqualTo("21-15-9 thrusters and pull-ups");
    }

    @Test void concurrentAddsAreNotLost() {
        IntStream.range(0, 1000).parallel().forEach(i -> catalog.add(new Wod("wod-" + i, "row " + i + " m")));
        assertThat(catalog.all()).hasSize(1002);
    }

    @Test void racingTheSameNameLetsExactlyOneWin() throws Exception {
        int coaches = 32;
        var start = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(coaches)) {
            var results = new ArrayList<Future<Boolean>>();
            for (int i = 0; i < coaches; i++) {
                int n = i;
                results.add(pool.submit(() -> {
                    start.await();
                    try {
                        catalog.add(new Wod("Murph", "version " + n));
                        return true;
                    } catch (DuplicateWodException e) {
                        return false;
                    }
                }));
            }
            start.countDown();
            long winners = 0;
            for (var r : results) if (r.get()) winners++;
            assertThat(winners).isEqualTo(1);
        }
    }

    @Test void aWodNeedsAName() {
        assertThatThrownBy(() -> new Wod(" ", "row 500 m")).isInstanceOf(IllegalArgumentException.class).hasMessage("WOD name is required");
        assertThatThrownBy(() -> new Wod(null, "row 500 m")).isInstanceOf(IllegalArgumentException.class);
    }
}
