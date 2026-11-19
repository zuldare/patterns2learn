package com.patterns2learn.box.command;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/** The receiver: who is booked into which class. It knows how to do things, not when or why. */
@Component
public class ClassRoster {
    private record Slot(String name, int capacity, List<String> athletes) {}

    private final Map<Integer, Slot> slots = Map.of(
        1, new Slot("18:00 WOD", 2, new ArrayList<>()),
        2, new Slot("19:00 WOD", 12, new ArrayList<>()));

    public synchronized String name(int session) {
        return slot(session).name();
    }

    public synchronized int capacity(int session) {
        return slot(session).capacity();
    }

    public synchronized void book(int session, String athlete) {
        Slot s = slot(session);
        if (s.athletes().contains(athlete)) throw new AlreadyBookedException(athlete, s.name());
        if (s.athletes().size() >= s.capacity()) throw new SessionFullException(s.name());
        s.athletes().add(athlete);
    }

    /** Removes the athlete and returns the spot they had, so it can be given back. */
    public synchronized int cancel(int session, String athlete) {
        Slot s = slot(session);
        int index = s.athletes().indexOf(athlete);
        if (index < 0) throw new NotBookedException(athlete, s.name());
        s.athletes().remove(index);
        return index;
    }

    /** Puts an athlete back in the spot they had (used to undo a cancellation). */
    public synchronized void restore(int session, int index, String athlete) {
        Slot s = slot(session);
        if (s.athletes().contains(athlete)) throw new AlreadyBookedException(athlete, s.name());
        s.athletes().add(Math.min(index, s.athletes().size()), athlete);
    }

    public synchronized boolean has(int session, String athlete) {
        return slot(session).athletes().contains(athlete);
    }

    public synchronized List<String> athletes(int session) {
        return List.copyOf(slot(session).athletes());
    }

    public synchronized void requireSession(int session) {
        slot(session);
    }

    private Slot slot(int session) {
        Slot s = slots.get(session);
        if (s == null) throw new UnknownSessionException(session);
        return s;
    }
}
