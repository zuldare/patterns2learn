package com.patterns2learn.box.adapter.before;

import static org.assertj.core.api.Assertions.assertThat;

import com.patterns2learn.box.adapter.Roster;
import com.patterns2learn.box.adapter.vendor.pulseband.PulseBandClient;
import org.junit.jupiter.api.Test;

class VendorBoundZoneBoardTest {
    @Test void worksButOnlyWithPulseBand() {
        PulseBandClient band = new PulseBandClient();
        band.simulate("PB-0042", 2.6, 1_700_000_000_000L);
        var board = new VendorBoundZoneBoard(band, new Roster());
        assertThat(board.zoneOf("ana").orElseThrow().zone()).isEqualTo(4);
        assertThat(board.zoneOf("leo")).isEmpty();
    }
}
