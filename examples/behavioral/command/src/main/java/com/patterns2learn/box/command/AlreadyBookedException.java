package com.patterns2learn.box.command;

public class AlreadyBookedException extends RuntimeException {
    public AlreadyBookedException(String athlete, String session) {
        super(athlete + " is already booked into " + session);
    }
}
