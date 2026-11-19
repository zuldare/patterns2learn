package com.patterns2learn.box.proxy;

public class ClassFullException extends RuntimeException {
    public ClassFullException(long sessionId) {
        super("class is full: " + sessionId);
    }
}
