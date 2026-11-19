package com.patterns2learn.box.builder;

/** The timetable has no room for another session. */
public class ScheduleFullException extends RuntimeException {
    public ScheduleFullException() {
        super("the schedule is full");
    }
}
