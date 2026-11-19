package com.patterns2learn.box.observer;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/** Sends the "new PR!" message. Here it only queues the text; a real one would call a push or email service. */
@Component
public class NotificationListener {
    private final BlockingQueue<String> sent = new LinkedBlockingQueue<>();

    // @step:async
    @Async          // slow I/O: run it on another thread so record() doesn't wait for it
    @EventListener
    public void on(PersonalRecordEvent e) {
        String delta = e.previousKg() == null ? "first" : "+" + (e.kg() - e.previousKg());
        sent.add(e.athlete() + ": new PR in " + e.lift() + ", " + e.kg() + " kg (" + delta + ")");
    }
    // @end

    public BlockingQueue<String> sent() {
        return sent;
    }
}
