package com.patterns2learn.box.iterator;

public class InvalidLimitException extends RuntimeException {
    public InvalidLimitException() {
        super("top must be between 1 and 100");
    }
}
