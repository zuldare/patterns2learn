package com.patterns2learn.box.abstractfactory;

import java.util.List;

/** What goes on the board for one athlete. */
public record WodCard(String title, List<String> lines, int timeCapMinutes) {
    public WodCard {
        lines = List.copyOf(lines);
    }
}
