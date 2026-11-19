package com.patterns2learn.box.mediator;

public final class Times {
    private Times() {}

    public static String format(int seconds) {
        return "%d:%02d".formatted(seconds / 60, seconds % 60);
    }
}
