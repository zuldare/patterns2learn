package com.patterns2learn.box.bridge;

public class UnknownMemberException extends RuntimeException {
    public UnknownMemberException(String id) {
        super("unknown member: " + id);
    }
}
