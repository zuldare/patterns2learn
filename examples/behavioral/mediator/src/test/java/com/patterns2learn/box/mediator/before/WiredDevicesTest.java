package com.patterns2learn.box.mediator.before;

import static org.assertj.core.api.Assertions.assertThat;

import com.patterns2learn.box.mediator.devices.Music;
import com.patterns2learn.box.mediator.devices.Screen;
import org.junit.jupiter.api.Test;

class WiredDevicesTest {
    @Test void itWorksButEveryDeviceKnowsTheOthers() {
        Music music = new Music();
        Screen screen = new Screen();
        WiredFinishLine finishLine = new WiredFinishLine(music, screen);
        WiredTimer timer = new WiredTimer(music, screen, finishLine);
        finishLine.setTimer(timer);              // they even know each other

        timer.start();
        finishLine.finish("Ana", 185);
        timer.cap();
        assertThat(screen.lines()).containsExactly("1. Ana 3:05");
    }
}
