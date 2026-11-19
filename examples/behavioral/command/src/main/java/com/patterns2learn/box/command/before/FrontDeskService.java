package com.patterns2learn.box.command.before;

import com.patterns2learn.box.command.ClassRoster;

/** Before: each action is a method, so "undo" has to remember by hand what the last one was. */
public class FrontDeskService {
    private final ClassRoster roster;
    private String lastAction;                       // "book", "cancel", "move"… or null
    private int lastSession;
    private String lastAthlete;
    private int lastSpot;

    public FrontDeskService(ClassRoster roster) {
        this.roster = roster;
    }

    public void book(int session, String athlete) {
        roster.book(session, athlete);
        remember("book", session, athlete, -1);
    }

    public void cancel(int session, String athlete) {
        remember("cancel", session, athlete, roster.cancel(session, athlete));
    }

    public void move(String athlete, int from, int to) {
        roster.book(to, athlete);
        roster.cancel(from, athlete);
        remember("move", to, athlete, -1);           // and where it came from? one more field…
    }

    // @step:undo-last
    public void undoLast() {
        if (lastAction == null) throw new IllegalStateException("nothing to undo");
        switch (lastAction) {
            case "book" -> roster.cancel(lastSession, lastAthlete);
            case "cancel" -> roster.restore(lastSession, lastSpot, lastAthlete);
            default -> throw new UnsupportedOperationException("can't undo a " + lastAction);
        }
        lastAction = null;                           // and the one before? forgotten
    }
    // @end

    private void remember(String action, int session, String athlete, int spot) {
        lastAction = action;
        lastSession = session;
        lastAthlete = athlete;
        lastSpot = spot;
    }
}
