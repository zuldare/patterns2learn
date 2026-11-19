package com.patterns2learn.box.iterator.before;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class BeforeTest {
    @Autowired JdbcClient jdbc;

    @Test void loadingEverythingWorksButReadsEveryRow() {
        LoadEverythingLeaderboard board = new LoadEverythingLeaderboard(jdbc);
        assertThat(board.top("fran", 3)).hasSize(3);
        assertThat(board.rowsRead()).isEqualTo(230);    // all of them, for a podium of 3
    }

    @Test void theOffsetLoopIsCopiedIntoEveryReport() {
        assertThat(new OffsetLoopReport(jdbc).count("fran")).isEqualTo(230);
    }
}
