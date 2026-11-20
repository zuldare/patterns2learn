package com.patterns2learn.box.bridge.channels;

import com.patterns2learn.box.bridge.Delivery;
import com.patterns2learn.box.bridge.Member;

// @step:implementor
/** The implementor: how a message reaches a member. It knows nothing about classes or payments. */
public interface Channel {
    String name();
    Delivery deliver(Member to, String title, String body);
}
// @end
