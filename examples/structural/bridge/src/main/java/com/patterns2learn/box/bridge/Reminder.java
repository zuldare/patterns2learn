package com.patterns2learn.box.bridge;

import com.patterns2learn.box.bridge.channels.Channel;

// @step:abstraction
/** The abstraction: what a reminder says. How it travels is the channel's business. */
public abstract class Reminder {
    private final Channel channel;                  // the bridge to the implementation

    protected Reminder(Channel channel) {
        if (channel == null) throw new InvalidReminderException("a reminder needs a channel");
        this.channel = channel;
    }

    public final Delivery send(Member member) {
        return channel.deliver(member, title(), body(member));
    }

    protected abstract String title();
    protected abstract String body(Member member);
}
// @end
