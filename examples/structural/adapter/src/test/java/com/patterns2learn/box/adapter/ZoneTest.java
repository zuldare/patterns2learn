package com.patterns2learn.box.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class ZoneTest {
    @Test void zonesArePercentagesOfMaxHeartRate() {
        assertThat(Zone.of(113, 190)).isEqualTo(1);   // 59%
        assertThat(Zone.of(114, 190)).isEqualTo(2);   // 60%
        assertThat(Zone.of(152, 190)).isEqualTo(4);   // 80%
        assertThat(Zone.of(171, 190)).isEqualTo(5);   // 90%
        assertThat(Zone.of(200, 190)).isEqualTo(5);
    }

    @Test void heartRatesOutsideHumanRangeAreRejected() {
        assertThatThrownBy(() -> new HeartRate(19, Instant.EPOCH)).hasMessage("bpm must be between 20 and 250");
        assertThatThrownBy(() -> new HeartRate(251, Instant.EPOCH)).hasMessage("bpm must be between 20 and 250");
        assertThatThrownBy(() -> new HeartRate(120, null)).hasMessage("time is required");
    }
}
