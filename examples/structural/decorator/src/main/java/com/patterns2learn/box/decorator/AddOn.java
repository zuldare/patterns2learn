package com.patterns2learn.box.decorator;

/** A named option that knows how to wrap a plan. One bean per option; @Order sets the wrapping order. */
public interface AddOn {
    String name();

    Membership wrap(Membership plan);
}
