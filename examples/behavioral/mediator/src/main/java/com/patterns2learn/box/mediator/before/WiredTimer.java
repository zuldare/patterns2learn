package com.patterns2learn.box.mediator.before;

import com.patterns2learn.box.mediator.devices.Music;
import com.patterns2learn.box.mediator.devices.Screen;

/** Before: the timer drives the music, the screen and the finish line itself. */
public class WiredTimer {
    private final Music music;
    private final Screen screen;
    private final WiredFinishLine finishLine;
    private boolean running;

    public WiredTimer(Music music, Screen screen, WiredFinishLine finishLine) {
        this.music = music;
        this.screen = screen;
        this.finishLine = finishLine;
    }

    public void start() {
        running = true;
        finishLine.reset();
        music.play(8);
        screen.showClock();
    }

    // @step:wired-cap
    public void cap() {
        running = false;
        music.stop();
        screen.showResults(finishLine.results());   // the timer reaches into the finish line
    }
    // @end

    public boolean isRunning() {
        return running;
    }
}
