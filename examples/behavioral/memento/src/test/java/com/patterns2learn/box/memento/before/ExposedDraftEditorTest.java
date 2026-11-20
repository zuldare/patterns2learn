package com.patterns2learn.box.memento.before;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class ExposedDraftEditorTest {
    @Test void undoFromOutsideRestoresWhatTheEditorRememberedToCopy() {
        ExposedDraft draft = new ExposedDraft();
        draft.setTitle("Fran");
        draft.setMovements(List.of("thrusters", "pull-ups"));
        draft.setTimeCapMinutes(10);
        ExposedDraftEditor editor = new ExposedDraftEditor(draft);

        editor.clearBoard();
        editor.undo();

        assertThat(draft.getTitle()).isEqualTo("Fran");
        assertThat(draft.getTimeCapMinutes()).isZero();     // nobody remembered to copy the time cap
    }
}
