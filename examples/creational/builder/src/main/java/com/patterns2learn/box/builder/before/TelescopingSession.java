package com.patterns2learn.box.builder.before;

import java.time.LocalTime;

/** Before: one constructor per combination of options, each calling the next with more arguments. */
public record TelescopingSession(String name, LocalTime startsAt, int minutes, int capacity,
                                 String coach, boolean beginnerFriendly, boolean waitlist) {
    // @step:telescoping
    public TelescopingSession(String name, LocalTime startsAt) {
        this(name, startsAt, 60);
    }

    public TelescopingSession(String name, LocalTime startsAt, int minutes) {
        this(name, startsAt, minutes, 12);
    }

    public TelescopingSession(String name, LocalTime startsAt, int minutes, int capacity) {
        this(name, startsAt, minutes, capacity, null, false, false);
    }

    public static TelescopingSession hyroxPrep() {
        return new TelescopingSession("Hyrox prep", LocalTime.of(18, 0), 60, 12, "Ana", true, false);
    }
    // @end
}
