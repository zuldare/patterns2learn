package com.patterns2learn.box.observer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class ResultServiceTest {
    @Autowired ResultService results;
    @Autowired LeaderboardListener leaderboard;
    @Autowired BadgeListener badges;
    @Autowired NotificationListener notifications;

    @Test void aPersonalRecordReachesEveryListener() throws Exception {
        results.record(new LiftResult("Ana", "Back squat", 100));

        // @step:pr-flow
        boolean pr = results.record(new LiftResult("Ana", "Back squat", 105));

        assertThat(pr).isTrue();
        assertThat(leaderboard.top("Back squat")).containsEntry("Ana", 105);
        assertThat(badges.badgesOf("Ana")).contains("PR club");
        // notifications run @Async, on another thread: wait for ours to arrive
        assertThat(nextMessageLike("Ana: new PR in Back squat, 105")).isEqualTo("Ana: new PR in Back squat, 105 kg (+5)");
        // @end
    }

    @Test void aLiftBelowYourBestIsNotARecord() throws Exception {
        results.record(new LiftResult("Leo", "Deadlift", 180));
        assertThat(results.record(new LiftResult("Leo", "Deadlift", 170))).isFalse();
        assertThat(leaderboard.top("Deadlift")).containsEntry("Leo", 180);
    }

    @Test void theFirstLiftIsAlwaysARecord() {
        assertThat(results.record(new LiftResult("Mia", "Clean", 70))).isTrue();
        assertThat(badges.badgesOf("Mia")).contains("PR club");
    }

    @Test void invalidLiftsAreRejected() {
        assertThatThrownBy(() -> new LiftResult(" ", "Clean", 70)).isInstanceOf(IllegalArgumentException.class).hasMessage("athlete is required");
        assertThatThrownBy(() -> new LiftResult("Ana", "", 70)).isInstanceOf(IllegalArgumentException.class).hasMessage("lift is required");
        assertThatThrownBy(() -> new LiftResult("Ana", "Clean", 0)).isInstanceOf(IllegalArgumentException.class).hasMessage("kg must be > 0");
    }

    /** Waits (up to 2 s) for the async notification starting with {@code prefix}, skipping earlier ones. */
    private String nextMessageLike(String prefix) throws InterruptedException {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(2);
        while (System.nanoTime() < deadline) {
            String message = notifications.sent().poll(100, TimeUnit.MILLISECONDS);
            if (message != null && message.startsWith(prefix)) return message;
        }
        return null;
    }
}
