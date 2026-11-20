package com.patterns2learn.box.bridge.channels;

/** Cuts by code points, so an emoji is never split in half. */
final class Texts {
    private Texts() {}

    static String cut(String s, int max) {
        if (s.codePointCount(0, s.length()) <= max) return s;
        return s.substring(0, s.offsetByCodePoints(0, max - 1)) + "…";
    }
}
