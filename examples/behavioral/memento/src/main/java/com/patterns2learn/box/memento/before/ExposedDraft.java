package com.patterns2learn.box.memento.before;

import java.util.ArrayList;
import java.util.List;

/** Before: the draft opens up every field with a getter and a setter, so others can save and restore it. */
public class ExposedDraft {
    private String title;
    private List<String> movements = new ArrayList<>();
    private int timeCapMinutes;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public List<String> getMovements() { return movements; }
    public void setMovements(List<String> movements) { this.movements = new ArrayList<>(movements); }
    public int getTimeCapMinutes() { return timeCapMinutes; }
    public void setTimeCapMinutes(int timeCapMinutes) { this.timeCapMinutes = timeCapMinutes; }
}
