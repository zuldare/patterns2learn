package com.patterns2learn.box.factorymethod;

/** The product: every WOD format can describe itself and say how it's scored. */
public interface Workout {
    String summary();

    String scoreUnit();

    boolean lowerIsBetter();
}
