package com.patterns2learn.box.flyweight.before;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.Set;
import org.junit.jupiter.api.Test;

class CopiedMovementLogTest {
    @Test void everySetCarriesItsOwnCopyOfTheMovement() {
        CopiedMovementLog log = new CopiedMovementLog();
        for (int i = 0; i < 3_000; i++) log.log("athlete-" + i, i % 2 == 0 ? "back squat" : "deadlift", 5, 100);

        Set<String> standards = Collections.newSetFromMap(new IdentityHashMap<>());
        log.sets().forEach(s -> standards.add(s.standard()));
        assertThat(standards).hasSize(3_000);                          // 3,000 distinct strings…
        assertThat(log.charsInCopies()).isGreaterThan(3_000 * 90L);    // …each with its own characters
    }
}
