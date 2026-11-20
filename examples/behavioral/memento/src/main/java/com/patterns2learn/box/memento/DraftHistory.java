package com.patterns2learn.box.memento;

import java.util.ArrayDeque;
import java.util.Deque;

/** The caretaker: keeps snapshots and hands them back. It never looks inside them. */
public class DraftHistory {
    private final int size;
    private final Deque<WhiteboardDraft.Snapshot> snapshots = new ArrayDeque<>();

    public DraftHistory() {
        this(20);
    }

    public DraftHistory(int size) {
        if (size < 1) throw new IllegalArgumentException("the history needs room for at least one snapshot");
        this.size = size;
    }

    // @step:caretaker
    public void save(WhiteboardDraft.Snapshot snapshot) {
        snapshots.push(snapshot);
        if (snapshots.size() > size) snapshots.removeLast();   // the oldest falls off
    }

    public WhiteboardDraft.Snapshot undo() {
        if (snapshots.isEmpty()) throw new NothingToUndoException();
        return snapshots.pop();
    }
    // @end
}
