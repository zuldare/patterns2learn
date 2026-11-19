package com.patterns2learn.box.observer;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.event.EventListener;

class SyncByDefaultTest {
    static class BrokenBadgePrinter {
        @EventListener
        void on(PersonalRecordEvent e) {
            throw new IllegalStateException("badge printer out of ink");
        }
    }

    @Test void aPlainListenerRunsInsideTheCallerAndItsExceptionReachesIt() {
        try (var context = new AnnotationConfigApplicationContext(ResultService.class, BrokenBadgePrinter.class)) {
            ResultService results = context.getBean(ResultService.class);
            // @step:sync-by-default
            // @EventListener runs on the same thread, during publishEvent():
            // a failing listener makes record() itself fail
            assertThatThrownBy(() -> results.record(new LiftResult("Ana", "Snatch", 60)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("badge printer out of ink");
            // @end
        }
    }
}
