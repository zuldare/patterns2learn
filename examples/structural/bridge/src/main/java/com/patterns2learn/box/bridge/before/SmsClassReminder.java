package com.patterns2learn.box.bridge.before;

import java.time.LocalTime;

public class SmsClassReminder {
    private final String className;
    private final LocalTime startsAt;

    public SmsClassReminder(String className, LocalTime startsAt) {
        this.className = className;
        this.startsAt = startsAt;
    }

    public String text(String name) {
        String text = "Class tomorrow: " + className + " at " + startsAt + ". See you on the floor, " + name + "!";
        return text.length() > 160 ? text.substring(0, 159) + "…" : text;
    }
}
