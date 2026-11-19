package com.patterns2learn.box.singleton;

import java.time.Duration;
import java.time.Instant;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

/** Each class gets its own clock: state per use, so prototype scope rather than a shared singleton. */
@Component
@Scope("prototype")
public class WodTimer {
    private Instant startedAt;

    public void start() {
        startedAt = Instant.now();
    }

    public Duration elapsed() {
        return startedAt == null ? Duration.ZERO : Duration.between(startedAt, Instant.now());
    }
}
