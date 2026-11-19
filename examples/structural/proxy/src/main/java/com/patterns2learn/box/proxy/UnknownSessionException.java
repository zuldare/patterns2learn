package com.patterns2learn.box.proxy;

public class UnknownSessionException extends RuntimeException {
    public UnknownSessionException(long sessionId) {
        super("unknown session: " + sessionId);
    }
}
