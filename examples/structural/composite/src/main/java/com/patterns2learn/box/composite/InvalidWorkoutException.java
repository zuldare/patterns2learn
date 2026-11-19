package com.patterns2learn.box.composite;

/** A part of a workout that breaks the box's rules (no name, too many rounds, too deep…). */
public class InvalidWorkoutException extends IllegalArgumentException {
    public InvalidWorkoutException(String message) {
        super(message);
    }
}
