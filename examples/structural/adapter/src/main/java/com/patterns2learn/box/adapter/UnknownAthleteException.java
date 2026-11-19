package com.patterns2learn.box.adapter;

public class UnknownAthleteException extends RuntimeException {
    public UnknownAthleteException(String id) {
        super("unknown athlete: " + id);
    }
}
