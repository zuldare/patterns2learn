package com.patterns2learn.box.command;

/** A command that can't even be created (no athlete, the same class twice…). */
public class InvalidCommandException extends IllegalArgumentException {
    public InvalidCommandException(String message) {
        super(message);
    }
}
