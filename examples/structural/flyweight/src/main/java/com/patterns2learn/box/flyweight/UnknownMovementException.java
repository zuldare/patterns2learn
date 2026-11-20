package com.patterns2learn.box.flyweight;

public class UnknownMovementException extends RuntimeException {
    public UnknownMovementException(String name) {
        super("unknown movement: " + name);
    }
}
