package com.patterns2learn.box.mediator.devices;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/** The big screen on the wall. It shows what it's told. */
@Component
public class Screen {
    private final List<String> lines = new ArrayList<>();

    public synchronized void showClock() {
        lines.clear();
        lines.add("clock running");
    }

    public synchronized void showFinish(String athlete, String time) {
        lines.add(athlete + " " + time);
    }

    public synchronized void showResults(List<String> results) {
        lines.clear();
        lines.addAll(results);
    }

    public synchronized List<String> lines() {
        return List.copyOf(lines);
    }
}
