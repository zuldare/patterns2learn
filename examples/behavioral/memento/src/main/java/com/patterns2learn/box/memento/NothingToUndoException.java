package com.patterns2learn.box.memento;

public class NothingToUndoException extends RuntimeException {
    public NothingToUndoException() {
        super("nothing to undo");
    }
}
