package com.patterns2learn.box.command;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.task.TaskExecutor;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class SpringDoesItTooTest {
    @Autowired TaskExecutor executor;   // auto-configured by Spring Boot
    @Autowired ClassRoster roster;

    @Test void aRunnableIsACommandSomeoneElseRunsLater() throws Exception {
        CountDownLatch done = new CountDownLatch(1);
        AtomicReference<String> thread = new AtomicReference<>();
        // @step:executor
        Runnable reminder = () -> {                  // an action packed into an object…
            roster.book(2, "Eva");
            thread.set(Thread.currentThread().getName());
            done.countDown();
        };
        executor.execute(reminder);                  // …handed to someone else, who runs it in another thread
        // @end
        assertThat(done.await(5, TimeUnit.SECONDS)).isTrue();
        assertThat(roster.athletes(2)).contains("Eva");
        assertThat(thread.get()).isNotEqualTo(Thread.currentThread().getName());
    }
}
