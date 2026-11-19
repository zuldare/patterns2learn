package com.patterns2learn.box.command;

/** Cancel a booking. Undo: give the athlete back the same spot. */
public final class CancelCommand implements Command {
    private final ClassRoster roster;
    private final int session;
    private final String athlete;
    private int spot = -1;    // remembered when it runs, so undo can restore it

    CancelCommand(ClassRoster roster, int session, String athlete) {
        this.roster = roster;
        this.session = session;
        this.athlete = athlete;
    }

    // @step:cancel
    @Override
    public void execute() {
        spot = roster.cancel(session, athlete);      // remember where they were…
    }

    @Override
    public void undo() {
        roster.restore(session, spot, athlete);      // …to put them back in the same place
    }
    // @end

    @Override
    public String describe() {
        return "cancel " + athlete + " from " + roster.name(session);
    }
}
