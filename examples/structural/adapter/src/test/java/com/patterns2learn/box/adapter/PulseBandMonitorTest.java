package com.patterns2learn.box.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.patterns2learn.box.adapter.vendor.pulseband.PulseBandClient;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;

class PulseBandMonitorTest {
    final PulseBandClient band = new PulseBandClient();
    final PulseBandMonitor monitor = new PulseBandMonitor(band, Map.of("ana", "PB-0042"));

    @Test void translatesBeatsPerSecondAndEpochMillisIntoOurHeartRate() {
        band.simulate("PB-0042", 2.7, 1_700_000_000_000L);
        assertThat(monitor.current("ana")).contains(new HeartRate(162, Instant.ofEpochMilli(1_700_000_000_000L)));
    }

    @Test void anUnpairedAthleteOrAnUnknownDeviceMeansNoSignal() {
        assertThat(monitor.current("leo")).isEmpty();          // no band paired
        assertThat(monitor.current("ana")).isEmpty();          // paired, but the vendor says "device not found"
    }

    @Test void roundsToTheNearestBeat() {
        band.simulate("PB-0042", 2.71, 1_700_000_000_000L);   // 162.6
        assertThat(monitor.current("ana")).map(HeartRate::bpm).contains(163);
    }

    @Test void aHugeReadingDoesNotWrapAroundIntoAPlausibleOne() {
        band.simulate("PB-0042", (Math.pow(2, 32) + 156) / 60, 1_700_000_000_000L);
        assertThatThrownBy(() -> monitor.current("ana")).isInstanceOf(MonitorException.class);
    }

    @Test void anImpossibleReadingIsAnErrorNotAHeartRate() {
        band.simulate("PB-0042", 0.0, 1_700_000_000_000L);   // band off the wrist
        assertThatThrownBy(() -> monitor.current("ana"))
            .isInstanceOf(MonitorException.class)
            .hasMessage("implausible PulseBand reading: 0 bpm");
    }
}
