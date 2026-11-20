package com.patterns2learn.box.flyweight;

public class LogFullException extends RuntimeException {
    public LogFullException() {
        super("the log is full");
    }
}
