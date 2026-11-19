package com.patterns2learn.box.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.patterns2learn.box.adapter.vendor.pulseband.PulseBandClient;
import java.time.Instant;
import java.util.NoSuchElementException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

/** Default wiring: no property set, so the box still uses PulseBand. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@DirtiesContext
class ZoneBoardTest {
    @Autowired ZoneBoard board;
    @Autowired HeartRateMonitor monitor;
    @Autowired PulseBandClient band;

    @Test void theDefaultAdapterIsPulseBand() {
        assertThat(monitor).isInstanceOf(PulseBandMonitor.class);
    }

    @Test void anaInZoneFour() {
        // @step:request
        band.simulate("PB-0042", 2.6, 1_700_000_000_000L);   // 156 bpm

        ZoneReading ana = board.zoneOf("ana").orElseThrow();

        assertThat(ana.bpm()).isEqualTo(156);
        assertThat(ana.zone()).isEqualTo(4);                 // 82% of her max (190)
        // @end
        assertThat(ana.athlete()).isEqualTo("Ana");
        assertThat(ana.at()).isEqualTo(Instant.ofEpochMilli(1_700_000_000_000L));
    }

    @Test void unknownAthletesAreRejectedAndSilentBandsAreEmpty() {
        assertThatThrownBy(() -> board.zoneOf("nobody")).isInstanceOf(NoSuchElementException.class).hasMessage("unknown athlete: nobody");
        assertThat(board.zoneOf("leo")).isEmpty();
    }

    @Test void athleteIdsAreTrimmedAndCaseInsensitive() {
        band.simulate("PB-0042", 2.0, 1_700_000_000_000L);
        assertThat(board.zoneOf(" ANA ").orElseThrow().athlete()).isEqualTo("Ana");
    }
}
