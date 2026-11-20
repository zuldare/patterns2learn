package com.patterns2learn.box.bridge;

public class InvalidReminderException extends RuntimeException {
    public InvalidReminderException(String message) {
        super(message);
    }
}
