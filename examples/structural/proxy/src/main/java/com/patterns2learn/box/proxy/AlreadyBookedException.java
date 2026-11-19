package com.patterns2learn.box.proxy;

public class AlreadyBookedException extends RuntimeException {
    public AlreadyBookedException(String athlete) {
        super("already booked: " + athlete);
    }
}
