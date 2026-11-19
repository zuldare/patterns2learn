package com.patterns2learn.box.decorator;

/** A Membership that wraps another one and adds something on top. */
public abstract class MembershipDecorator implements Membership {
    protected final Membership inner;

    protected MembershipDecorator(Membership inner) {
        this.inner = inner;
    }
}
