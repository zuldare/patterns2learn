package com.patterns2learn.box.command;

public class SessionFullException extends RuntimeException {
    public SessionFullException(String session) {
        super(session + " is full");
    }
}
