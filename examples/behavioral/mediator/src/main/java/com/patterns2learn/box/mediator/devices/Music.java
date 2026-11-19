package com.patterns2learn.box.mediator.devices;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/** The box's sound system. It plays what it's told; it knows nothing about WODs. */
@Component
public class Music {
    private final List<String> log = new ArrayList<>();

    public synchronized void play(int volume) { record("play at " + volume); }
    public synchronized void cue(String sound) { record("cue " + sound); }
    public synchronized void stop() { record("stop"); }

    public synchronized List<String> log() {
        return List.copyOf(log);
    }

    private void record(String line) {
        log.add(line);
        if (log.size() > 200) log.removeFirst();
    }
}
