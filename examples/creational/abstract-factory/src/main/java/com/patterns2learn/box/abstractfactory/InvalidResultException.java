package com.patterns2learn.box.abstractfactory;

/** A Fran result that can't exist (more reps than the WOD has, more time than the cap…). */
public class InvalidResultException extends IllegalArgumentException {
    public InvalidResultException(String message) {
        super(message);
    }
}
