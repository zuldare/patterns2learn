package com.patterns2learn.box.builder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalTime;
import org.junit.jupiter.api.Test;

class ClassSessionTest {
    @Test void theBuilderNamesEveryChoice() {
        // @step:usage
        ClassSession hyrox = ClassSession.builder("Hyrox prep", LocalTime.of(18, 0))
            .coach("Ana")
            .beginnerFriendly()
            .build();
        // @end
        assertThat(hyrox.minutes()).isEqualTo(60);
        assertThat(hyrox.capacity()).isEqualTo(12);
        assertThat(hyrox.coach()).isEqualTo("Ana");
        assertThat(hyrox.beginnerFriendly()).isTrue();
        assertThat(hyrox.waitlist()).isFalse();
    }

    @Test void everyOptionCanBeSet() {
        ClassSession s = ClassSession.builder("Competitors", LocalTime.of(7, 0))
            .minutes(90).capacity(8).coach("Leo").waitlist().build();
        assertThat(s).isEqualTo(new ClassSession("Competitors", LocalTime.of(7, 0), 90, 8, "Leo", false, true));
    }

    @Test void buildRejectsImpossibleSessions() {
        assertThatThrownBy(() -> ClassSession.builder(" ", LocalTime.NOON).build()).hasMessage("name is required");
        assertThatThrownBy(() -> ClassSession.builder("x".repeat(61), LocalTime.NOON).build()).hasMessage("name is at most 60 characters");
        assertThatThrownBy(() -> ClassSession.builder("WOD", null).build()).hasMessage("start time is required");
        assertThatThrownBy(() -> ClassSession.builder("WOD", LocalTime.NOON).capacity(0).build()).hasMessage("capacity must be between 1 and 30");
        assertThatThrownBy(() -> ClassSession.builder("WOD", LocalTime.NOON).capacity(31).build()).hasMessage("capacity must be between 1 and 30");
        assertThatThrownBy(() -> ClassSession.builder("WOD", LocalTime.NOON).minutes(50).build()).hasMessage("minutes must be 15 to 120, in steps of 15");
        assertThatThrownBy(() -> ClassSession.builder("WOD", LocalTime.NOON).minutes(135).build()).hasMessage("minutes must be 15 to 120, in steps of 15");
        assertThatThrownBy(() -> ClassSession.builder("WOD", LocalTime.NOON).beginnerFriendly().build()).hasMessage("a beginner-friendly class needs a coach");
        assertThatThrownBy(() -> ClassSession.builder("WOD", LocalTime.NOON).coach(" ").build()).hasMessage("coach cannot be blank");
        assertThatThrownBy(() -> ClassSession.builder("WOD", LocalTime.NOON).coach("x".repeat(41)).build()).hasMessage("coach is at most 40 characters");
    }

    @Test void theConstructorEnforcesTheSameRulesSoNobodyCanSkipThem() {
        assertThatThrownBy(() -> new ClassSession("WOD", LocalTime.NOON, 60, 0, null, false, false))
            .hasMessage("capacity must be between 1 and 30");
    }

    @Test void aBuilderCanBeReusedAndEachBuildIsIndependent() {
        ClassSession.Builder morning = ClassSession.builder("WOD", LocalTime.of(7, 0)).coach("Ana");
        ClassSession first = morning.build();
        ClassSession second = morning.capacity(20).build();
        assertThat(first.capacity()).isEqualTo(12);
        assertThat(second.capacity()).isEqualTo(20);
    }

    @Test void namesAndCoachesAreTrimmed() {
        ClassSession s = ClassSession.builder("  WOD ", LocalTime.NOON).coach(" Ana ").build();
        assertThat(s.name()).isEqualTo("WOD");
        assertThat(s.coach()).isEqualTo("Ana");
    }
}
