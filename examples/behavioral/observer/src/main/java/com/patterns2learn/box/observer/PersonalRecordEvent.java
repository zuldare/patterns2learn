package com.patterns2learn.box.observer;

/** Published when an athlete beats their best; previousKg is null for a first lift. */
public record PersonalRecordEvent(String athlete, String lift, int kg, Integer previousKg) {}
