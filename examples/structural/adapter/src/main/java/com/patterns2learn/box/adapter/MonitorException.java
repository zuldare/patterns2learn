package com.patterns2learn.box.adapter;

/** A band answered, but with something we can't use. The message is for the logs; the API answers with a neutral one. */
public class MonitorException extends RuntimeException {
    public MonitorException(String message) {
        super(message);
    }
}
