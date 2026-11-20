package com.patterns2learn.box.flyweight.before;

import java.util.List;

/** Before: every set carries the whole movement with it, standard text and equipment included. */
public record CopiedSet(String athlete, int reps, int kg,
                        String movement, String category, String standard, List<String> equipment) {}
