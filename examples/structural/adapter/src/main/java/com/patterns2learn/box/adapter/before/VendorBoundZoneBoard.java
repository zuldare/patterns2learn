package com.patterns2learn.box.adapter.before;

import com.patterns2learn.box.adapter.Athlete;
import com.patterns2learn.box.adapter.Roster;
import com.patterns2learn.box.adapter.Zone;
import com.patterns2learn.box.adapter.ZoneReading;
import com.patterns2learn.box.adapter.vendor.pulseband.PulseBandBeat;
import com.patterns2learn.box.adapter.vendor.pulseband.PulseBandClient;
import com.patterns2learn.box.adapter.vendor.pulseband.PulseBandException;
import java.time.Instant;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;

/** Before: the board talks to PulseBand directly, so PulseBand's types and units are everywhere. */
public class VendorBoundZoneBoard {
    private static final Map<String, String> SERIALS = Map.of("ana", "PB-0042");
    private final PulseBandClient pulseBand;
    private final Roster roster;

    public VendorBoundZoneBoard(PulseBandClient pulseBand, Roster roster) {
        this.pulseBand = pulseBand;
        this.roster = roster;
    }

    // @step:vendor-bound
    public Optional<ZoneReading> zoneOf(String athleteId) {
        Athlete a = roster.find(athleteId).orElseThrow(() -> new NoSuchElementException("unknown athlete"));
        String serial = SERIALS.get(a.id());
        if (serial == null) return Optional.empty();
        PulseBandBeat beat;
        try {
            beat = pulseBand.latestBeat(serial);
        } catch (PulseBandException e) {
            return Optional.empty();
        }
        int bpm = (int) Math.round(beat.beatsPerSecond() * 60);   // PulseBand counts per second
        Instant at = Instant.ofEpochMilli(beat.epochMillis());
        return Optional.of(new ZoneReading(a.name(), bpm, Zone.of(bpm, a.maxHr()), at));
    }
    // @end
}
