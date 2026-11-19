package com.patterns2learn.box.adapter;

import com.patterns2learn.box.adapter.vendor.pulseband.PulseBandBeat;
import com.patterns2learn.box.adapter.vendor.pulseband.PulseBandClient;
import com.patterns2learn.box.adapter.vendor.pulseband.PulseBandException;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

/** Adapter: makes PulseBand's SDK look like a HeartRateMonitor. */
public class PulseBandMonitor implements HeartRateMonitor {
    private final PulseBandClient band;              // the adaptee, wrapped (not inherited)
    private final Map<String, String> serialByAthlete;

    public PulseBandMonitor(PulseBandClient band, Map<String, String> serialByAthlete) {
        this.band = band;
        this.serialByAthlete = Map.copyOf(serialByAthlete);
    }

    // @step:adapter
    @Override
    public Optional<HeartRate> current(String athleteId) {
        String serial = serialByAthlete.get(athleteId);          // our id → their serial
        if (serial == null) return Optional.empty();
        try {
            PulseBandBeat beat = band.latestBeat(serial);
            long bpm = Math.round(beat.beatsPerSecond() * 60);   // per second → per minute
            if (bpm < 20 || bpm > 250) {
                throw new MonitorException("implausible PulseBand reading: " + bpm + " bpm");
            }
            return Optional.of(new HeartRate((int) bpm, Instant.ofEpochMilli(beat.epochMillis())));
        } catch (PulseBandException e) {
            return Optional.empty();                             // their error → our "no signal"
        }
    }
    // @end
}
