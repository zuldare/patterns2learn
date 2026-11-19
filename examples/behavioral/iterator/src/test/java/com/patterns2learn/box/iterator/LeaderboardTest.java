package com.patterns2learn.box.iterator;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class LeaderboardTest {
    @Autowired Leaderboard leaderboard;

    @Test void eachAthleteAppearsOnceWithTheirBestTime() {
        assertThat(leaderboard.top("fran", 5)).extracting(Placing::athlete)
            .containsExactly("Athlete 83", "Leo", "Ana", "Athlete 29", "Athlete 65");   // Ana's 2:33 is skipped
        assertThat(leaderboard.top("FRAN", 1)).extracting(Placing::time).containsExactly("2:31");
    }
}
