package com.patterns2learn.box.singleton;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;

class WodCatalogTest {
    private final WodCatalog catalog = new WodCatalog();

    @Test void startsWithTheBenchmarkGirlsSortedByName() {
        assertThat(catalog.all()).extracting(Wod::name).containsExactly("Cindy", "Fran");
        assertThat(catalog.find("Fran")).hasValueSatisfying(w -> assertThat(w.workout()).isEqualTo("21-15-9 thrusters and pull-ups"));
    }

    @Test void addsANewWod() {
        catalog.add(WodCatalog.MURPH);
        assertThat(catalog.find("Murph")).contains(WodCatalog.MURPH);
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
}
