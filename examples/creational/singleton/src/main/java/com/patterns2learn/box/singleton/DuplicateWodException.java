package com.patterns2learn.box.singleton;

public class DuplicateWodException extends RuntimeException {
    public DuplicateWodException(String name) {
        super("WOD already exists: " + name);
    }
}
