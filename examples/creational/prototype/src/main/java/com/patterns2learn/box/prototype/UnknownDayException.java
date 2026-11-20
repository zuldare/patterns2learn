package com.patterns2learn.box.prototype;

public class UnknownDayException extends RuntimeException {
    public UnknownDayException(String day) {
        super("no plan for " + day);
    }
}
