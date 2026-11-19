package com.patterns2learn.box.command;

public class NotBookedException extends RuntimeException {
    public NotBookedException(String athlete, String session) {
        super(athlete + " is not booked into " + session);
    }
}
