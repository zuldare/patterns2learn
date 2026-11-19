package com.patterns2learn.box.facade.subsystems;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Component;

/** Subsystem: sends the liability waiver to sign. */
@Component
public class Waivers {
    private final List<String> sentTo = new CopyOnWriteArrayList<>();

    public void send(Member member) {
        sentTo.add(member.email());
    }

    public List<String> sentTo() {
        return List.copyOf(sentTo);
    }
}
