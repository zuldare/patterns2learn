package com.patterns2learn.box.iterator;

/** One row of the leaderboard. */
public record Placing(int rank, String athlete, String time) {
    static Placing of(int rank, Result r) {
        return new Placing(rank, r.athlete(), "%d:%02d".formatted(r.seconds() / 60, r.seconds() % 60));
    }
}
