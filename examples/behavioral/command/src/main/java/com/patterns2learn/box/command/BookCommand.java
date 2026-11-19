package com.patterns2learn.box.command;

/** Book an athlete into a class. Undo: cancel that booking. */
public final class BookCommand implements Command {
    private final ClassRoster roster;
    private final int session;
    private final String athlete;

    BookCommand(ClassRoster roster, int session, String athlete) {
        this.roster = roster;
        this.session = session;
        this.athlete = athlete;
    }

    // @step:book
    @Override
    public void execute() {
        roster.book(session, athlete);
    }

    @Override
    public void undo() {
        roster.cancel(session, athlete);
    }

    @Override
    public String describe() {
        return "book " + athlete + " into " + roster.name(session);
    }
    // @end
}
