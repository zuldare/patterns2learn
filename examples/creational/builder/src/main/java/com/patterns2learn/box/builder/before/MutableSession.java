package com.patterns2learn.box.builder.before;

import java.time.LocalTime;

/** Also before: an empty object you fill in with setters, one line at a time. */
public class MutableSession {
    private String name;
    private LocalTime startsAt;
    private int minutes = 60;
    private int capacity = 12;
    private String coach;
    private boolean beginnerFriendly;
    private boolean waitlist;

    // @step:setters
    public static MutableSession hyroxPrep() {
        MutableSession s = new MutableSession();   // exists already, with no name and no time
        s.setName("Hyrox prep");
        s.setStartsAt(LocalTime.of(18, 0));
        s.setCoach("Ana");
        s.setBeginnerFriendly(true);
        return s;                                  // forget a line and nobody notices
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;                  // 0? -3? accepted
    }
    // @end

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public LocalTime getStartsAt() { return startsAt; }
    public void setStartsAt(LocalTime startsAt) { this.startsAt = startsAt; }
    public int getMinutes() { return minutes; }
    public void setMinutes(int minutes) { this.minutes = minutes; }
    public int getCapacity() { return capacity; }
    public String getCoach() { return coach; }
    public void setCoach(String coach) { this.coach = coach; }
    public boolean isBeginnerFriendly() { return beginnerFriendly; }
    public void setBeginnerFriendly(boolean beginnerFriendly) { this.beginnerFriendly = beginnerFriendly; }
    public boolean isWaitlist() { return waitlist; }
    public void setWaitlist(boolean waitlist) { this.waitlist = waitlist; }
}
