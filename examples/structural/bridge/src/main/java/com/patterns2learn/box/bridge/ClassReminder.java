package com.patterns2learn.box.bridge;

import com.patterns2learn.box.bridge.channels.Channel;
import java.time.LocalTime;

/** A refined abstraction: tomorrow's class. */
public class ClassReminder extends Reminder {
    private final String className;
    private final LocalTime startsAt;

    public ClassReminder(Channel channel, String className, LocalTime startsAt) {
        super(channel);
        if (className == null || className.isBlank()) throw new InvalidReminderException("class name is required");
        if (className.strip().length() > 120) throw new InvalidReminderException("class name is at most 120 characters");
        if (startsAt == null) throw new InvalidReminderException("start time is required");
        this.className = className.strip();
        this.startsAt = startsAt;
    }

    // @step:refined
    @Override protected String title() { return "Class tomorrow"; }

    @Override protected String body(Member m) {
        return className + " at " + startsAt + ". See you on the floor, " + m.name() + "!";
    }
    // @end
}
