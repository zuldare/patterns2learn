package com.patterns2learn.box.observer.before;

import static org.assertj.core.api.Assertions.assertThat;

import com.patterns2learn.box.observer.LiftResult;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class ManualPrSubjectTest {
    @Test void subscribersHearAboutRecords() {
        List<String> heard = new ArrayList<>();
        var subject = new ManualPrSubject();
        subject.subscribe(e -> heard.add("leaderboard " + e.kg()));
        subject.subscribe(e -> heard.add("badges " + e.athlete()));

        subject.record(new LiftResult("Ana", "Back squat", 100));
        subject.record(new LiftResult("Ana", "Back squat", 90)); // not a PR: nobody hears

        assertThat(heard).containsExactly("leaderboard 100", "badges Ana");
    }
}
