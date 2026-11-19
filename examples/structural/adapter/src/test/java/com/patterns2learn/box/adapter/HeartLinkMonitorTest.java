package com.patterns2learn.box.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.patterns2learn.box.adapter.vendor.heartlink.HeartLinkHub;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;

class HeartLinkMonitorTest {
    final HeartLinkHub hub = new HeartLinkHub();
    final HeartLinkMonitor monitor = new HeartLinkMonitor(hub, Map.of("ana", 3));

    @Test void parsesTheVendorTextFormatIntoOurHeartRate() {
        hub.simulate(3, "HR=171;T=1700000000");
        assertThat(monitor.current("ana")).contains(new HeartRate(171, Instant.ofEpochSecond(1_700_000_000L)));
    }

    @Test void noSignalAndUnpairedAthletesAreEmpty() {
        assertThat(monitor.current("ana")).isEmpty();           // the hub answers NO_SIGNAL
        assertThat(monitor.current("leo")).isEmpty();           // no channel paired
    }

    @Test void anUnreadableSampleIsAnErrorNotAFakeReading() {
        hub.simulate(3, "HR=;T=abc");
        assertThatThrownBy(() -> monitor.current("ana"))
            .isInstanceOf(MonitorException.class)
            .hasMessage("unreadable HeartLink sample on channel 3");
    }

    @Test void anImpossibleHeartRateIsAnError() {
        hub.simulate(3, "HR=999;T=1700000000");
        assertThatThrownBy(() -> monitor.current("ana"))
            .isInstanceOf(MonitorException.class)
            .hasMessage("implausible HeartLink reading: 999 bpm");
    }
}
