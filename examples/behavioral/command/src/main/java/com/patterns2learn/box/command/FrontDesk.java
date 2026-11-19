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
    private final int historySize;
    private final int logSize;
    private final Deque<Command> history = new ArrayDeque<>();
    private final List<String> log = new ArrayList<>();

    @Autowired
    public FrontDesk() {
        this(50, 200);
    }

    FrontDesk(int historySize) {
        this(historySize, 200);
    }

    FrontDesk(int historySize, int logSize) {
        this.historySize = historySize;
        this.logSize = logSize;
    }

    // @step:invoker
    public synchronized String run(Command command) {
        command.execute();                          // if it fails, it never reaches the history
        history.push(command);
        if (history.size() > historySize) history.removeLast();
        record("done: " + command.describe());
        return command.describe();
    }

    public synchronized String undo() {
        if (history.isEmpty()) throw new NothingToUndoException();
        Command last = history.peek();
        last.undo();                                // if undo fails, the command stays in the history
        history.pop();
        record("undone: " + last.describe());
        return last.describe();
    }
    // @end

    public synchronized List<String> log() {
        return List.copyOf(log);
    }

    private void record(String line) {
        log.add(line);
        if (log.size() > logSize) log.removeFirst();
    }
}
