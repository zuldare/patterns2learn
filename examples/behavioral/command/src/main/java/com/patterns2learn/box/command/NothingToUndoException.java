package com.patterns2learn.box.command;

public class NothingToUndoException extends RuntimeException {
    public NothingToUndoException() {
        super("nothing to undo");
    }
}
