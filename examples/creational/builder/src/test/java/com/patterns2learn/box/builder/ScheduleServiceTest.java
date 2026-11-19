package com.patterns2learn.box.builder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalTime;
import org.junit.jupiter.api.Test;

class ScheduleServiceTest {
    final ScheduleService schedule = new ScheduleService(new SessionTemplates());

    @Test void onlyTheFieldsInTheRequestAreSetTheRestKeepTheirDefaults() {
        // @step:request
        Scheduled hyrox = schedule.schedule(new SessionRequest("Hyrox prep", LocalTime.of(18, 0), null, null, "Ana", true, null));

        assertThat(hyrox.session().minutes()).isEqualTo(60);   // default
        assertThat(hyrox.session().capacity()).isEqualTo(12);  // default
        assertThat(hyrox.session().beginnerFriendly()).isTrue();
        // @end
        assertThat(hyrox.id()).isEqualTo(1);
        assertThat(schedule.find(1)).contains(hyrox);
        assertThat(schedule.find(99)).isEmpty();
    }

    @Test void templatesGoThroughTheDirector() {
        Scheduled s = schedule.fromTemplate("open-gym", LocalTime.NOON, null);
        assertThat(s.session().name()).isEqualTo("Open gym");
    }

    @Test void invalidRequestsAreRejectedByBuild() {
        assertThatThrownBy(() -> schedule.schedule(new SessionRequest("WOD", LocalTime.NOON, 50, null, null, null, null)))
            .hasMessage("minutes must be 15 to 120, in steps of 15");
    }

    @Test void theScheduleIsBounded() {
        ScheduleService small = new ScheduleService(new SessionTemplates(), 2);
        small.schedule(new SessionRequest("A", LocalTime.NOON, null, null, null, null, null));
        small.schedule(new SessionRequest("B", LocalTime.NOON, null, null, null, null, null));
        assertThatThrownBy(() -> small.schedule(new SessionRequest("C", LocalTime.NOON, null, null, null, null, null)))
            .isInstanceOf(IllegalStateException.class).hasMessage("the schedule is full");
    }
}
