package com.patterns2learn.box.memento;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DraftService {
    public record DraftView(String title, List<String> movements, int timeCapMinutes) {}

    private final WhiteboardDraft draft = new WhiteboardDraft("Fran", List.of("21-15-9 thrusters", "pull-ups"), 10);
    private final DraftHistory history = new DraftHistory();

    // @step:service
    public synchronized DraftView edit(String title, List<String> movements, int cap) {
        WhiteboardDraft.Snapshot before = draft.snapshot();
        draft.edit(title, movements, cap);          // if this refuses, nothing is saved
        history.save(before);
        return view();
    }

    public synchronized DraftView clear() {
        history.save(draft.snapshot());
        draft.clear();
        return view();
    }

    public synchronized DraftView undo() {
        draft.restore(history.undo());
        return view();
    }
    // @end

    public synchronized DraftView view() {
        return new DraftView(draft.title(), draft.movements(), draft.timeCapMinutes());
    }
}
