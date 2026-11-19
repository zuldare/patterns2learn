package com.patterns2learn.box.facade;

/** A sign-up form that breaks its own rules (no name, a bad email…). */
public class InvalidJoinRequestException extends IllegalArgumentException {
    public InvalidJoinRequestException(String message) {
        super(message);
    }
}
