package com.patterns2learn.box.command;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class FrontDeskTest {
    final ClassRoster roster = new ClassRoster();
    final DeskCommands commands = new DeskCommands(roster);
    final FrontDesk desk = new FrontDesk();

    @Test void anyActionCanBeUndone() {
        // @step:undo-test
        desk.run(commands.book(1, "Leo"));      // oops, it was Lea
        desk.undo();
        desk.run(commands.book(1, "Lea"));

        assertThat(roster.athletes(1)).containsExactly("Lea");
        // @end
        assertThat(desk.log()).containsExactly("done: book Leo into 18:00 WOD", "undone: book Leo into 18:00 WOD", "done: book Lea into 18:00 WOD");
    }

    @Test void undoingACancellationPutsTheAthleteBackInTheSameSpot() {
        desk.run(commands.book(2, "Ana"));
        desk.run(commands.book(2, "Leo"));
        desk.run(commands.book(2, "Eva"));
        desk.run(commands.cancel(2, "Leo"));
        assertThat(roster.athletes(2)).containsExactly("Ana", "Eva");
        desk.undo();
        assertThat(roster.athletes(2)).containsExactly("Ana", "Leo", "Eva");
    }

    @Test void aMoveIsOneActionAndOneUndo() {
        desk.run(commands.book(1, "Ana"));
        desk.run(commands.move("Ana", 1, 2));
        assertThat(roster.athletes(1)).isEmpty();
        assertThat(roster.athletes(2)).containsExactly("Ana");
        desk.undo();
        assertThat(roster.athletes(1)).containsExactly("Ana");
        assertThat(roster.athletes(2)).isEmpty();
    }

    @Test void undoGoesBackwardsOneActionAtATime() {
        desk.run(commands.book(2, "Ana"));
        desk.run(commands.book(2, "Leo"));
        desk.undo();
        desk.undo();
        assertThat(roster.athletes(2)).isEmpty();
        assertThatThrownBy(desk::undo).isInstanceOf(NothingToUndoException.class).hasMessage("nothing to undo");
    }

    @Test void aFailedActionLeavesNoTraceInTheHistory() {
        desk.run(commands.book(1, "Ana"));
        desk.run(commands.book(1, "Leo"));
        assertThatThrownBy(() -> desk.run(commands.book(1, "Eva"))).isInstanceOf(SessionFullException.class).hasMessage("18:00 WOD is full");
        assertThatThrownBy(() -> desk.run(commands.move("Eva", 2, 1))).isInstanceOf(NotBookedException.class).hasMessage("Eva is not booked into 19:00 WOD");
        assertThatThrownBy(() -> desk.run(commands.move("Ana", 1, 1))).isInstanceOf(IllegalArgumentException.class).hasMessage("pick two different classes");
        desk.undo();                                   // undoes Leo, not the failures
        assertThat(roster.athletes(1)).containsExactly("Ana");
    }

    @Test void aMoveIntoAFullClassChangesNothing() {
        desk.run(commands.book(1, "Ana"));
        desk.run(commands.book(1, "Leo"));
        desk.run(commands.book(2, "Eva"));
        assertThatThrownBy(() -> desk.run(commands.move("Eva", 2, 1))).isInstanceOf(SessionFullException.class);
        assertThat(roster.athletes(2)).containsExactly("Eva");
    }

    @Test void theHistoryIsBounded() {
        FrontDesk small = new FrontDesk(2);
        small.run(commands.book(2, "Ana"));
        small.run(commands.book(2, "Leo"));
        small.run(commands.book(2, "Eva"));
        small.undo();
        small.undo();
        assertThatThrownBy(small::undo).isInstanceOf(NothingToUndoException.class);
        assertThat(roster.athletes(2)).containsExactly("Ana");   // the oldest action fell off the history
    }

    @Test void commandsAreValidatedWhenCreated() {
        assertThatThrownBy(() -> commands.book(9, "Ana")).isInstanceOf(UnknownSessionException.class).hasMessage("unknown class: 9");
        assertThatThrownBy(() -> commands.book(1, " ")).isInstanceOf(IllegalArgumentException.class).hasMessage("athlete is required");
        assertThatThrownBy(() -> commands.book(1, "x".repeat(41))).hasMessage("athlete is at most 40 characters");
        desk.run(commands.book(1, " Ana "));
        assertThatThrownBy(() -> desk.run(commands.book(1, "Ana"))).isInstanceOf(AlreadyBookedException.class).hasMessage("Ana is already booked into 18:00 WOD");
        assertThatThrownBy(() -> desk.run(commands.cancel(2, "Ana"))).isInstanceOf(NotBookedException.class);
    }
}
