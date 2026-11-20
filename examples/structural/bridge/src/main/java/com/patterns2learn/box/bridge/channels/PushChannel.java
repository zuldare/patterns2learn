package com.patterns2learn.box.bridge.channels;

import com.patterns2learn.box.bridge.Delivery;
import com.patterns2learn.box.bridge.Member;
import org.springframework.stereotype.Component;

@Component
public class PushChannel implements Channel {
    @Override public String name() { return "push"; }

    @Override
    public Delivery deliver(Member to, String title, String body) {
        return new Delivery(name(), to.device(), Texts.cut(title, 40) + " | " + Texts.cut(body, 120));
    }
}
