package com.patterns2learn.box.adapter;

import java.util.NoSuchElementException;
import java.util.Optional;
import org.springframework.stereotype.Service;

/** The client: shows each athlete's zone. It only knows HeartRateMonitor, never a vendor. */
@Service
public class ZoneBoard {
    private final HeartRateMonitor monitor;
    private final Roster roster;

    public ZoneBoard(HeartRateMonitor monitor, Roster roster) {
        this.monitor = monitor;
        this.roster = roster;
    }

    // @step:board
    public Optional<ZoneReading> zoneOf(String athleteId) {
        Athlete a = roster.find(athleteId)
            .orElseThrow(() -> new NoSuchElementException("unknown athlete: " + abbreviate(athleteId)));
        return monitor.current(a.id())
            .map(hr -> new ZoneReading(a.name(), hr.bpm(), Zone.of(hr.bpm(), a.maxHr()), hr.at()));
    }
    // @end

    private static String abbreviate(String s) {
        if (s == null) return "";
        String t = s.strip();
        return t.length() <= 40 ? t : t.substring(0, 40) + "…";
    }
}
