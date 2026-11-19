package com.patterns2learn.box.builder;

import java.time.LocalTime;

/** A class on the box timetable. Immutable: once built, it is valid and stays that way. */
public record ClassSession(String name, LocalTime startsAt, int minutes, int capacity,
                           String coach, boolean beginnerFriendly, boolean waitlist) {
    // @step:validate
    public ClassSession {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("name is required");
        name = name.strip();
        if (name.length() > 60) throw new IllegalArgumentException("name is at most 60 characters");
        if (startsAt == null) throw new IllegalArgumentException("start time is required");
        if (minutes < 15 || minutes > 120 || minutes % 15 != 0) {
            throw new IllegalArgumentException("minutes must be 15 to 120, in steps of 15");
        }
        if (capacity < 1 || capacity > 30) {
            throw new IllegalArgumentException("capacity must be between 1 and 30");
        }
        if (coach != null) {
            if (coach.isBlank()) throw new IllegalArgumentException("coach cannot be blank");
            coach = coach.strip();
            if (coach.length() > 40) throw new IllegalArgumentException("coach is at most 40 characters");
        }
        if (beginnerFriendly && coach == null) {
            throw new IllegalArgumentException("a beginner-friendly class needs a coach");
        }
    }
    // @end

    // @step:builder
    /** What every class needs goes in here; everything else has a sensible default. */
    public static Builder builder(String name, LocalTime startsAt) {
        return new Builder(name, startsAt);
    }

    public static final class Builder {
        private final String name;
        private final LocalTime startsAt;
        private int minutes = 60;
        private int capacity = 12;
        private String coach;
        private boolean beginnerFriendly;
        private boolean waitlist;

        private Builder(String name, LocalTime startsAt) {
            this.name = name;
            this.startsAt = startsAt;
        }

        public Builder minutes(int minutes) { this.minutes = minutes; return this; }
        public Builder capacity(int capacity) { this.capacity = capacity; return this; }
        public Builder coach(String coach) { this.coach = coach; return this; }
        public Builder beginnerFriendly() { this.beginnerFriendly = true; return this; }
        public Builder waitlist() { this.waitlist = true; return this; }

        public ClassSession build() {
            return new ClassSession(name, startsAt, minutes, capacity, coach, beginnerFriendly, waitlist);
        }
    }
    // @end
}
