package com.patterns2learn.box.mediator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.patterns2learn.box.mediator.devices.FinishLine;
import com.patterns2learn.box.mediator.devices.Music;
import com.patterns2learn.box.mediator.devices.Screen;
import com.patterns2learn.box.mediator.devices.WodTimer;
import org.junit.jupiter.api.Test;

class ClassFloorTest {
    final Music music = new Music();
    final Screen screen = new Screen();
    final ClassFloor floor = new ClassFloor(music, screen);
    final WodTimer timer = new WodTimer(floor);
    final FinishLine finishLine = new FinishLine(floor);

    @Test void theFloorCoordinatesEveryDeviceThroughOneClass() {
        // @step:flow
        timer.start();                         // music up, clock on the screen
        finishLine.finish("Ana", 185);         // her time on the screen, the bell rings
        finishLine.finish("Leo", 172);
        timer.cap();                           // music off, results on the screen
        // @end
        assertThat(music.log()).containsExactly("play at 8", "cue bell", "cue bell", "stop");
        assertThat(screen.lines()).containsExactly("1. Leo 2:52", "2. Ana 3:05");
    }

    @Test void whileRunningTheScreenShowsTheClockAndEachFinish() {
        timer.start();
        assertThat(screen.lines()).containsExactly("clock running");
        finishLine.finish("Ana", 185);
        assertThat(screen.lines()).containsExactly("clock running", "Ana 3:05");
    }

    @Test void theRulesLiveInTheMediator() {
        assertThatThrownBy(() -> finishLine.finish("Ana", 185)).isInstanceOf(FloorRuleException.class).hasMessage("the WOD hasn't started");
        timer.start();
        assertThatThrownBy(timer::start).hasMessage("the WOD is already running");
        finishLine.finish("Ana", 185);
        assertThatThrownBy(() -> finishLine.finish(" ana ", 190)).hasMessage("Ana already finished");
        timer.cap();
        assertThatThrownBy(timer::cap).hasMessage("the WOD hasn't started");
    }

    @Test void aNewWodStartsClean() {
        timer.start();
        finishLine.finish("Ana", 185);
        timer.cap();
        timer.start();
        finishLine.finish("Ana", 170);         // Ana again, in the next WOD
        timer.cap();
        assertThat(screen.lines()).containsExactly("1. Ana 2:50");
    }

    @Test void finishesAreValidated() {
        timer.start();
        assertThatThrownBy(() -> finishLine.finish(" ", 100)).isInstanceOf(InvalidFinishException.class).hasMessage("athlete is required");
        assertThatThrownBy(() -> finishLine.finish("x".repeat(41), 100)).hasMessage("athlete is at most 40 characters");
        assertThatThrownBy(() -> finishLine.finish("Ana", 0)).hasMessage("time must be between 1 and 3600 seconds");
    }
}
