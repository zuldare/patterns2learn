package com.patterns2learn.box.abstractfactory;

/** Product (data): which pulling movement the athlete does. */
public record PullVariant(String name) {
    public PullVariant {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("pull variant is required");
    }
}
