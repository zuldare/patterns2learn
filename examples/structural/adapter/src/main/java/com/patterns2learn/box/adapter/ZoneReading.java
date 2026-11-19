package com.patterns2learn.box.adapter;

import java.time.Instant;

/** What the whiteboard shows for one athlete. */
public record ZoneReading(String athlete, int bpm, int zone, Instant at) {}
