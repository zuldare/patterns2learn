package com.patterns2learn.box.state;

/** Someone else changed the membership between reading it and saving it. */
public class ConcurrentChangeException extends RuntimeException {
    public ConcurrentChangeException() {
        super("membership changed meanwhile, try again");
    }
}
