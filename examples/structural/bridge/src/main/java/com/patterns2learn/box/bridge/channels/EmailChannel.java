package com.patterns2learn.box.bridge.channels;

import com.patterns2learn.box.bridge.Delivery;
import com.patterns2learn.box.bridge.Member;
import org.springframework.stereotype.Component;

@Component("email")
public class EmailChannel implements Channel {
    @Override public String name() { return "email"; }

    @Override
    public Delivery deliver(Member to, String title, String body) {
        return new Delivery(name(), to.email(), "Subject: " + title + "\n\n" + body);
    }
}
