package com.patterns2learn.box.memento.before;

import java.util.List;

/** Before: the editor copies the draft's fields into its own variables to be able to undo. */
public class ExposedDraftEditor {
    private final ExposedDraft draft;
    private String savedTitle;
    private List<String> savedMovements;

    public ExposedDraftEditor(ExposedDraft draft) {
        this.draft = draft;
    }

    // @step:exposed
    public void clearBoard() {
        savedTitle = draft.getTitle();                       // the editor has to know every field…
        savedMovements = List.copyOf(draft.getMovements());
        draft.setTitle("Untitled");
        draft.setMovements(List.of());
        draft.setTimeCapMinutes(0);                          // …and the time cap was never saved
    }

    public void undo() {
        draft.setTitle(savedTitle);
        draft.setMovements(savedMovements);
    }
    // @end
}
