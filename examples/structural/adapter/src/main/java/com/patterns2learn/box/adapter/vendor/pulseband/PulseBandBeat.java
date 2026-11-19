package com.patterns2learn.box.adapter.vendor.pulseband;

/** PulseBand's reading: beats per SECOND and a timestamp in epoch milliseconds. */
public record PulseBandBeat(double beatsPerSecond, long epochMillis) {}
