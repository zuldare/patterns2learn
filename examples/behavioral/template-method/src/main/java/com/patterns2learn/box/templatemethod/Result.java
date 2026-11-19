package com.patterns2learn.box.templatemethod;

/** One athlete's score in a WOD: reps, or seconds for "for time" WODs. */
public record Result(String athlete, String wod, int score) {}
