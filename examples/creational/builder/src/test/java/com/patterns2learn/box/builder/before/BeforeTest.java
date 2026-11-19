package com.patterns2learn.box.builder.before;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalTime;
import org.junit.jupiter.api.Test;

class BeforeTest {
    @Test void theTelescopingCallSiteIsCorrectButUnreadable() {
        TelescopingSession hyrox = TelescopingSession.hyroxPrep();
        assertThat(hyrox.coach()).isEqualTo("Ana");
        assertThat(hyrox.beginnerFriendly()).isTrue();
        assertThat(hyrox.waitlist()).isFalse();
    }

    @Test void swappingTwoBooleansCompilesAndSilentlyChangesTheClass() {
        var swapped = new TelescopingSession("Hyrox prep", LocalTime.of(18, 0), 60, 12, "Ana", false, true);
        assertThat(swapped.beginnerFriendly()).isFalse();   // nobody notices until the class is full of beginners
    }

    @Test void aMutableSessionCanBeLeftHalfBuiltOrInvalid() {
        MutableSession s = MutableSession.hyroxPrep();
        assertThat(s.getCapacity()).isEqualTo(12);
        MutableSession half = new MutableSession();
        half.setName("Hyrox prep");
        assertThat(half.getStartsAt()).isNull();             // no start time, and nothing complains
        half.setCapacity(0);
        assertThat(half.getCapacity()).isZero();              // an impossible class, also accepted
    }
}
