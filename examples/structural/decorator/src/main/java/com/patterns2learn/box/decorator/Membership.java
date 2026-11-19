package com.patterns2learn.box.decorator;

/** What every plan, plain or decorated, can tell you. */
public interface Membership {
    String description();

    Money monthlyFee();
}
