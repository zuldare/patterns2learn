package com.patterns2learn.box.command;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/** The invoker: runs commands, remembers them and can undo them. It doesn't know what any of them does. */
@Service
public class FrontDesk {
    private static final int LOG_SIZE = 200;
    private final int historySize;
    private final Deque<Command> history = new ArrayDeque<>();
    private final List<String> log = new ArrayList<>();

    @Autowired
    public FrontDesk() {
        this(50);
    }

    FrontDesk(int historySize) {
        this.historySize = historySize;
    }

    // @step:invoker
    public synchronized String run(Command command) {
        command.execute();                          // if it fails, it never reaches the history
        history.push(command);
        if (history.size() > historySize) history.removeLast();
        return record("done: " + command.describe());
    }

    public synchronized String undo() {
        if (history.isEmpty()) throw new NothingToUndoException();
        Command last = history.pop();
        last.undo();
        return record("undone: " + last.describe());
    }
    // @end

    public synchronized List<String> log() {
        return List.copyOf(log);
    }

    private String record(String line) {
        log.add(line);
        if (log.size() > LOG_SIZE) log.removeFirst();
        return line;
    }
}
