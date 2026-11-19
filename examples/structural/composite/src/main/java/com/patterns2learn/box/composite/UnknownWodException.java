package com.patterns2learn.box.composite;

public class UnknownWodException extends RuntimeException {
    public UnknownWodException(String name) {
        super("unknown WOD: " + name);
    }
}
