package com.patterns2learn.box.templatemethod;

/** One athlete's score in a WOD: seconds for "for time" WODs like Fran, rounds or reps for AMRAPs like Cindy. */
public record Result(String athlete, String wod, int score) {}
