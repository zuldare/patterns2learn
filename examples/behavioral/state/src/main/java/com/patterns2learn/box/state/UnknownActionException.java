package com.patterns2learn.box.state;

public class UnknownActionException extends RuntimeException {
    public UnknownActionException(String action) {
        super("unknown action: " + action);
    }
}
