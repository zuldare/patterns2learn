package com.patterns2learn.box.adapter.vendor.pulseband;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Stand-in for a vendor SDK you can't change (think of it as a jar from PulseBand).
 * Devices are identified by serial number; unknown serials throw.
 */
public class PulseBandClient {
    private final Map<String, PulseBandBeat> latest = new ConcurrentHashMap<>();

    public PulseBandBeat latestBeat(String serial) {
        PulseBandBeat beat = latest.get(serial);
        if (beat == null) throw new PulseBandException("device not found: " + serial);
        return beat;
    }

    /** Simulation hook for the example (the real band would push readings over Bluetooth). */
    public void simulate(String serial, double beatsPerSecond, long epochMillis) {
        latest.put(serial, new PulseBandBeat(beatsPerSecond, epochMillis));
    }
}
