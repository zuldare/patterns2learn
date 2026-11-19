package com.patterns2learn.box.mediator;

import com.patterns2learn.box.mediator.devices.Music;
import com.patterns2learn.box.mediator.devices.Screen;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Component;

/** The concrete mediator: every rule about how the devices work together lives here. */
@Component
public class ClassFloor implements FloorMediator {
    private record Finish(String athlete, int seconds) {}

    private final Music music;
    private final Screen screen;
    private final Map<String, Finish> finishes = new LinkedHashMap<>();
    private boolean running;

    public ClassFloor(Music music, Screen screen) {
        this.music = music;
        this.screen = screen;
    }

    // @step:floor
    @Override
    public synchronized void timerStarted() {
        if (running) throw new FloorRuleException("the WOD is already running");
        running = true;
        finishes.clear();
        music.play(8);
        screen.showClock();
    }

    @Override
    public synchronized void athleteFinished(String athlete, int seconds) {
        if (!running) throw new FloorRuleException("the WOD hasn't started");
        String key = athlete.toLowerCase(Locale.ROOT);
        if (finishes.containsKey(key)) throw new FloorRuleException(finishes.get(key).athlete() + " already finished");
        finishes.put(key, new Finish(athlete, seconds));
        screen.showFinish(athlete, Times.format(seconds));
        music.cue("bell");
    }

    @Override
    public synchronized void capReached() {
        if (!running) throw new FloorRuleException("the WOD hasn't started");
        running = false;
        music.stop();
        screen.showResults(results());
    }
    // @end

    private List<String> results() {
        List<Finish> sorted = new ArrayList<>(finishes.values());
        sorted.sort(Comparator.comparingInt(Finish::seconds));
        List<String> lines = new ArrayList<>();
        for (int i = 0; i < sorted.size(); i++) {
            lines.add((i + 1) + ". " + sorted.get(i).athlete() + " " + Times.format(sorted.get(i).seconds()));
        }
        return lines;
    }
}
