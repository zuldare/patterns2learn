package com.patterns2learn.box.adapter;

import java.util.Optional;

// @step:target
/** The target: what the box needs from any heart-rate band, in its own words. */
public interface HeartRateMonitor {
    /** The athlete's latest heart rate, or empty if their band has no signal. */
    Optional<HeartRate> current(String athleteId);
}
// @end
