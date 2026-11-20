package com.patterns2learn.box.memento;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class WhiteboardDraftTest {
    @Test void aSnapshotBringsBackEveryFieldEvenTheOnesYouForget() {
        // @step:undo
        WhiteboardDraft draft = new WhiteboardDraft("Fran", List.of("21-15-9 thrusters", "pull-ups"), 10);
        DraftHistory history = new DraftHistory();

        history.save(draft.snapshot());      // before the change
        draft.clear();                       // oops: the whole board is gone
        draft.restore(history.undo());

        assertThat(draft.title()).isEqualTo("Fran");
        assertThat(draft.timeCapMinutes()).isEqualTo(10);
        // @end
        assertThat(draft.movements()).containsExactly("21-15-9 thrusters", "pull-ups");
    }

    @Test void clearingLeavesABlankButValidDraft() {
        WhiteboardDraft draft = new WhiteboardDraft("Fran", List.of("thrusters"), 10);
        draft.clear();
        assertThat(draft.title()).isEqualTo("Untitled");
        assertThat(draft.movements()).isEmpty();
        assertThat(draft.timeCapMinutes()).isEqualTo(20);
        assertThatThrownBy(() -> new DraftHistory(0)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void undoGoesBackOneSnapshotAtATime() {
        WhiteboardDraft draft = new WhiteboardDraft("Fran", List.of("thrusters"), 10);
        DraftHistory history = new DraftHistory();
        history.save(draft.snapshot());
        draft.edit("Grace", List.of("30 clean & jerks"), 8);
        history.save(draft.snapshot());
        draft.edit("Isabel", List.of("30 snatches"), 8);
        draft.restore(history.undo());
        assertThat(draft.title()).isEqualTo("Grace");
        draft.restore(history.undo());
        assertThat(draft.title()).isEqualTo("Fran");
        assertThatThrownBy(history::undo).isInstanceOf(NothingToUndoException.class).hasMessage("nothing to undo");
    }

    @Test void aSnapshotIsFrozenEvenIfTheDraftKeepsChanging() {
        WhiteboardDraft draft = new WhiteboardDraft("Fran", List.of("thrusters"), 10);
        WhiteboardDraft.Snapshot before = draft.snapshot();
        draft.edit("Fran", List.of("thrusters", "pull-ups"), 12);
        draft.restore(before);
        assertThat(draft.movements()).containsExactly("thrusters");
        assertThat(draft.timeCapMinutes()).isEqualTo(10);
    }

    @Test void theHistoryIsBounded() {
        WhiteboardDraft draft = new WhiteboardDraft("W0", List.of("a"), 10);
        DraftHistory history = new DraftHistory(2);
        for (int i = 1; i <= 3; i++) {
            history.save(draft.snapshot());
            draft.edit("W" + i, List.of("a"), 10);
        }
        draft.restore(history.undo());
        draft.restore(history.undo());
        assertThat(draft.title()).isEqualTo("W1");               // W0's snapshot fell off
        assertThatThrownBy(history::undo).isInstanceOf(NothingToUndoException.class);
    }

    @Test void draftsAreValidated() {
        assertThatThrownBy(() -> new WhiteboardDraft(" ", List.of("a"), 10)).isInstanceOf(InvalidDraftException.class).hasMessage("title is required");
        assertThatThrownBy(() -> new WhiteboardDraft("W", List.of("a"), 0)).hasMessage("time cap must be between 1 and 90 minutes");
        assertThatThrownBy(() -> new WhiteboardDraft("W", java.util.Collections.nCopies(13, "a"), 10)).hasMessage("at most 12 movements");
        assertThatThrownBy(() -> new WhiteboardDraft("W", java.util.Arrays.asList("a", " "), 10)).hasMessage("movements cannot be blank");
        assertThatThrownBy(() -> new WhiteboardDraft("W", List.of("x".repeat(61)), 10)).hasMessage("a movement is at most 60 characters");
    }
}
