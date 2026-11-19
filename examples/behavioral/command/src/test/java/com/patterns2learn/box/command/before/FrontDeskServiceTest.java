package com.patterns2learn.box.command.before;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.patterns2learn.box.command.ClassRoster;
import org.junit.jupiter.api.Test;

class FrontDeskServiceTest {
    final ClassRoster roster = new ClassRoster();
    final FrontDeskService desk = new FrontDeskService(roster);

    @Test void itCanUndoTheLastBookingOrCancellation() {
        desk.book(2, "Leo");
        desk.undoLast();
        assertThat(roster.athletes(2)).isEmpty();
    }

    @Test void butOnlyOneStepAndNotEveryKindOfAction() {
        desk.book(2, "Ana");
        desk.book(2, "Leo");
        desk.undoLast();
        assertThatThrownBy(desk::undoLast).isInstanceOf(IllegalStateException.class);   // only remembers the last one
        desk.move("Ana", 2, 1);
        assertThatThrownBy(desk::undoLast).isInstanceOf(UnsupportedOperationException.class);
    }
}
