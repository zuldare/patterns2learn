package com.patterns2learn.box.singleton;

public class UnknownWodException extends RuntimeException {
    public UnknownWodException(String name) {
        super("unknown WOD: " + name);
    }
}
