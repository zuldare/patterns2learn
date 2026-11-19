package com.patterns2learn.box.command;

// @step:command
/** An action at the front desk, packed into an object: it can be run, undone and described. */
public interface Command {
    void execute();
    void undo();
    String describe();
}
// @end
