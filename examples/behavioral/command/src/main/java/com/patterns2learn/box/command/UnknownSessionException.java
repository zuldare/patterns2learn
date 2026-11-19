package com.patterns2learn.box.command;

public class UnknownSessionException extends RuntimeException {
    public UnknownSessionException(int id) {
        super("unknown class: " + id);
    }
}
