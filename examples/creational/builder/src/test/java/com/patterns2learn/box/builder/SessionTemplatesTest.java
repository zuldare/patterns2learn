package com.patterns2learn.box.builder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalTime;
import org.junit.jupiter.api.Test;

class SessionTemplatesTest {
    final SessionTemplates templates = new SessionTemplates();

    @Test void aBeginnerClassIsSmallLongerAndCoached() {
        ClassSession s = templates.build("beginner", LocalTime.of(19, 0), "Ana");
        assertThat(s).isEqualTo(new ClassSession("Beginners", LocalTime.of(19, 0), 75, 8, "Ana", true, true));
    }

    @Test void anOpenGymHasNoCoachAndMoreRoom() {
        ClassSession s = templates.build("open-gym", LocalTime.of(12, 0), null);
        assertThat(s).isEqualTo(new ClassSession("Open gym", LocalTime.of(12, 0), 120, 20, null, false, false));
    }

    @Test void templatesAreCaseInsensitiveAndUnknownOnesAreRejected() {
        assertThat(templates.build(" Beginner ", LocalTime.NOON, "Ana").name()).isEqualTo("Beginners");
        assertThatThrownBy(() -> templates.build("zen", LocalTime.NOON, "Ana")).hasMessage("unknown template: zen");
        assertThatThrownBy(() -> templates.build("beginner", LocalTime.NOON, null)).hasMessage("a beginner-friendly class needs a coach");
    }
}
