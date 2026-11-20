package com.patterns2learn.box.memento;

import java.util.ArrayList;
import java.util.List;

/** The originator: the WOD the coach is drafting for the whiteboard. Its fields stay private. */
public class WhiteboardDraft {
    private String title;
    private final List<String> movements = new ArrayList<>();
    private int timeCapMinutes;

    public WhiteboardDraft(String title, List<String> movements, int timeCapMinutes) {
        edit(title, movements, timeCapMinutes);
    }

    // @step:memento
    /** The memento: a frozen copy of the draft. Only WhiteboardDraft can read what's inside. */
    public static final class Snapshot {
        private final String title;
        private final List<String> movements;
        private final int timeCapMinutes;

        private Snapshot(String title, List<String> movements, int timeCapMinutes) {
            this.title = title;
            this.movements = List.copyOf(movements);
            this.timeCapMinutes = timeCapMinutes;
        }
    }

    public Snapshot snapshot() {
        return new Snapshot(title, movements, timeCapMinutes);   // every field, without exposing any
    }

    public void restore(Snapshot s) {
        title = s.title;
        movements.clear();
        movements.addAll(s.movements);
        timeCapMinutes = s.timeCapMinutes;
    }
    // @end

    /** Validates everything first, so a refused edit changes nothing. */
    public void edit(String newTitle, List<String> newMovements, int newCap) {
        if (newTitle == null || newTitle.isBlank()) throw new InvalidDraftException("title is required");
        if (newTitle.strip().length() > 40) throw new InvalidDraftException("title is at most 40 characters");
        if (newCap < 1 || newCap > 90) throw new InvalidDraftException("time cap must be between 1 and 90 minutes");
        if (newMovements == null) throw new InvalidDraftException("movements are required");
        if (newMovements.size() > 12) throw new InvalidDraftException("at most 12 movements");
        List<String> cleaned = new ArrayList<>();
        for (String m : newMovements) {
            if (m == null || m.isBlank()) throw new InvalidDraftException("movements cannot be blank");
            if (m.strip().length() > 60) throw new InvalidDraftException("a movement is at most 60 characters");
            cleaned.add(m.strip());
        }
        title = newTitle.strip();
        movements.clear();
        movements.addAll(cleaned);
        timeCapMinutes = newCap;
    }

    static final int DEFAULT_CAP = 20;

    /** Wipes the board back to a blank, valid draft (a change with no easy inverse operation). */
    public void clear() {
        title = "Untitled";
        movements.clear();
        timeCapMinutes = DEFAULT_CAP;
    }

    public String title() { return title; }
    public List<String> movements() { return List.copyOf(movements); }
    public int timeCapMinutes() { return timeCapMinutes; }
}
