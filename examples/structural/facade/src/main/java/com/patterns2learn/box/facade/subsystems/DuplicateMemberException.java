package com.patterns2learn.box.facade.subsystems;

public class DuplicateMemberException extends RuntimeException {
    public DuplicateMemberException() {
        super("email already registered");
    }
}
