package com.patterns2learn.box.flyweight;

/** One set an athlete logged: its own data plus a reference to the shared movement. */
public record LoggedSet(String athlete, Movement movement, int reps, int kg) {
    public String line() {
        return movement.line(athlete, reps, kg);
    }
}
