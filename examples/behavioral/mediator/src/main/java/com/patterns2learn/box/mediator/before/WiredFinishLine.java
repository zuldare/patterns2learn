package com.patterns2learn.box.mediator.before;

import com.patterns2learn.box.mediator.Times;
import com.patterns2learn.box.mediator.devices.Music;
import com.patterns2learn.box.mediator.devices.Screen;
import java.util.ArrayList;
import java.util.List;

/** Before: the finish line knows the music, the screen… and the timer, which knows it back. */
public class WiredFinishLine {
    private final Music music;
    private final Screen screen;
    private WiredTimer timer;
    private final List<int[]> times = new ArrayList<>();
    private final List<String> names = new ArrayList<>();

    public WiredFinishLine(Music music, Screen screen) {
        this.music = music;
        this.screen = screen;
    }

    public void setTimer(WiredTimer timer) {
        this.timer = timer;
    }

    // @step:wired
    public void finish(String athlete, int seconds) {
        if (!timer.isRunning()) throw new IllegalStateException("the WOD hasn't started");   // asks the timer
        names.add(athlete);
        times.add(new int[] {seconds, names.size() - 1});
        screen.showFinish(athlete, Times.format(seconds));                                   // drives the screen
        music.cue("bell");                                                                   // and the music
    }
    // @end

    void reset() {
        names.clear();
        times.clear();
    }

    List<String> results() {
        List<int[]> sorted = new ArrayList<>(times);
        sorted.sort((a, b) -> Integer.compare(a[0], b[0]));
        List<String> lines = new ArrayList<>();
        for (int i = 0; i < sorted.size(); i++) {
            lines.add((i + 1) + ". " + names.get(sorted.get(i)[1]) + " " + Times.format(sorted.get(i)[0]));
        }
        return lines;
    }
}
