package com.patterns2learn.box.command;

/** Move an athlete to another class: one action for the desk, two changes in the roster. */
public final class MoveCommand implements Command {
    private final ClassRoster roster;
    private final String athlete;
    private final int from;
    private final int to;
    private int spot = -1;

    MoveCommand(ClassRoster roster, String athlete, int from, int to) {
        this.roster = roster;
        this.athlete = athlete;
        this.from = from;
        this.to = to;
    }

    @Override
    public void execute() {
        if (!roster.has(from, athlete)) throw new NotBookedException(athlete, roster.name(from));
        roster.book(to, athlete);                    // may fail (full): then nothing has changed
        spot = roster.cancel(from, athlete);
    }

    @Override
    public void undo() {
        roster.restore(from, spot, athlete);         // if this fails, nothing has changed yet
        roster.cancel(to, athlete);
    }

    @Override
    public String describe() {
        return "move " + athlete + " from " + roster.name(from) + " to " + roster.name(to);
    }
}
