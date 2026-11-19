package com.patterns2learn.box.adapter;

import static org.assertj.core.api.Assertions.assertThat;

import com.patterns2learn.box.adapter.vendor.heartlink.HeartLinkHub;
import com.patterns2learn.box.adapter.vendor.pulseband.PulseBandClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

/** The box switches vendor with one property; ZoneBoard doesn't change. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE, properties = "box.monitors.vendor=heartlink")
class HeartLinkWiringTest {
    @Autowired ZoneBoard board;
    @Autowired HeartRateMonitor monitor;
    @Autowired HeartLinkHub hub;
    @Autowired ApplicationContext context;

    @Test void theHeartLinkAdapterReplacesPulseBand() {
        assertThat(monitor).isInstanceOf(HeartLinkMonitor.class);
        assertThat(context.getBeanNamesForType(HeartRateMonitor.class)).containsExactly("heartLinkMonitor");
        assertThat(context.getBeanNamesForType(PulseBandClient.class)).isEmpty();
    }

    @Test void theBoardWorksTheSameWithTheOtherVendor() {
        hub.simulate(3, "HR=171;T=1700000000");
        ZoneReading ana = board.zoneOf("ana").orElseThrow();
        assertThat(ana.bpm()).isEqualTo(171);
        assertThat(ana.zone()).isEqualTo(5);
    }
}
