package com.patterns2learn.box.adapter;

/** A band answered, but with something we can't use. Vendor details stay behind the adapter. */
public class MonitorException extends RuntimeException {
    public MonitorException(String message) {
        super(message);
    }
}
