package com.patterns2learn.box.bridge.before;

import java.time.LocalTime;

/** Before: one class per kind of reminder AND per channel. */
public class EmailClassReminder {
    private final String className;
    private final LocalTime startsAt;

    public EmailClassReminder(String className, LocalTime startsAt) {
        this.className = className;
        this.startsAt = startsAt;
    }

    public String text(String name) {
        return "Subject: Class tomorrow\n\n" + className + " at " + startsAt + ". See you on the floor, " + name + "!";
    }
}
