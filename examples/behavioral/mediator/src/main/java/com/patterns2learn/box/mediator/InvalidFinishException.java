package com.patterns2learn.box.mediator;

/** A finish that makes no sense on its own (no athlete, a time out of range…). */
public class InvalidFinishException extends RuntimeException {
    public InvalidFinishException(String message) {
        super(message);
    }
}
