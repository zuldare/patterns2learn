package com.patterns2learn.box.mediator.devices;

import static org.assertj.core.api.Assertions.assertThat;

import com.patterns2learn.box.mediator.FloorMediator;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

/** The senders can be tested with a fake mediator: they know nothing about music or screens. */
class DevicesTest {
    final List<String> told = new ArrayList<>();
    final FloorMediator fake = new FloorMediator() {
        @Override public void timerStarted() { told.add("started"); }
        @Override public void athleteFinished(String athlete, int seconds) { told.add(athlete + " " + seconds); }
        @Override public void capReached() { told.add("cap"); }
    };

    @Test void theTimerOnlyReports() {
        WodTimer timer = new WodTimer(fake);
        timer.start();
        timer.cap();
        assertThat(told).containsExactly("started", "cap");
    }

    @Test void theFinishLineValidatesAndReports() {
        new FinishLine(fake).finish("  Ana ", 185);
        assertThat(told).containsExactly("Ana 185");
    }
}
