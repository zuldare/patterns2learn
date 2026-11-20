package com.patterns2learn.box.visitor;

/** A workout element that breaks the box's rules. */
public class InvalidElementException extends IllegalArgumentException {
    public InvalidElementException(String message) {
        super(message);
    }
}
