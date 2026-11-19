package com.patterns2learn.box.adapter.vendor.heartlink;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Stand-in for another vendor SDK you can't change (a HeartLink hub on the wall).
 * Straps are identified by radio channel and samples come as text: "HR=142;T=1700000000"
 * (T in epoch SECONDS), or "NO_SIGNAL".
 */
public class HeartLinkHub {
    public static final String NO_SIGNAL = "NO_SIGNAL";
    private final Map<Integer, String> samples = new ConcurrentHashMap<>();

    public String readSample(int channel) {
        return samples.getOrDefault(channel, NO_SIGNAL);
    }

    /** Simulation hook for the example. */
    public void simulate(int channel, String raw) {
        samples.put(channel, raw);
    }
}
