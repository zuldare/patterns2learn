package com.patterns2learn.box.command;

import org.springframework.stereotype.Component;

/** Creates the commands, already wired to the roster and validated. */
@Component
public class DeskCommands {
    private final ClassRoster roster;

    public DeskCommands(ClassRoster roster) {
        this.roster = roster;
    }

    public Command book(int session, String athlete) {
        roster.requireSession(session);
        return new BookCommand(roster, session, name(athlete));
    }

    public Command cancel(int session, String athlete) {
        roster.requireSession(session);
        return new CancelCommand(roster, session, name(athlete));
    }

    public Command move(String athlete, int from, int to) {
        roster.requireSession(from);
        roster.requireSession(to);
        if (from == to) throw new InvalidCommandException("pick two different classes");
        return new MoveCommand(roster, name(athlete), from, to);
    }

    private static String name(String athlete) {
        if (athlete == null || athlete.isBlank()) throw new InvalidCommandException("athlete is required");
        String a = athlete.strip();
        if (a.length() > 40) throw new InvalidCommandException("athlete is at most 40 characters");
        return a;
    }
}
