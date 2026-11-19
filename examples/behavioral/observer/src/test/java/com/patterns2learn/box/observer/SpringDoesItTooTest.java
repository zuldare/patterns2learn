package com.patterns2learn.box.observer;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;

class SpringDoesItTooTest {
    static final List<String> heard = new ArrayList<>();

    // @step:context-events
    static class BoxOpening {
        @EventListener(ContextRefreshedEvent.class)
        void doorsOpen() {
            heard.add("context ready: warm up the rower displays");
        }

        @EventListener(ContextClosedEvent.class)
        void doorsClose() {
            heard.add("context closing: save today's leaderboard");
        }
    }
    // @end

    @Test void springPublishesItsOwnLifecycleEvents() {
        heard.clear();
        try (var context = new AnnotationConfigApplicationContext(BoxOpening.class)) {
            assertThat(heard).containsExactly("context ready: warm up the rower displays");
        }
        assertThat(heard).hasSize(2).last().isEqualTo("context closing: save today's leaderboard");
    }
}
