package com.patterns2learn.box.bridge.channels;

import com.patterns2learn.box.bridge.Delivery;
import com.patterns2learn.box.bridge.Member;
import org.springframework.stereotype.Component;

@Component("push")
public class PushChannel implements Channel {
    @Override public String name() { return "push"; }

    @Override
    public Delivery deliver(Member to, String title, String body) {
        return new Delivery(name(), to.device(), cut(title, 40) + " | " + cut(body, 120));
    }

    private static String cut(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max - 1) + "…";
    }
}
