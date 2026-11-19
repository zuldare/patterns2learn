package com.patterns2learn.box.facade.subsystems;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Component;

/** Subsystem: emails (kept in an in-memory outbox for the example). */
@Component
public class Mailer {
    private final List<String> outbox = new CopyOnWriteArrayList<>();

    public void welcome(Member member, String card, String introClass) {
        outbox.add("To %s: welcome, %s! Your card is %s and your intro class is %s."
            .formatted(member.email(), member.name(), card, introClass));
    }

    public List<String> outbox() {
        return List.copyOf(outbox);
    }
}
