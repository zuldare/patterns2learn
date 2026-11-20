package com.patterns2learn.box.prototype;

public class UnknownWeekException extends RuntimeException {
    public UnknownWeekException(long id) {
        super("unknown week: " + id);
    }
}
