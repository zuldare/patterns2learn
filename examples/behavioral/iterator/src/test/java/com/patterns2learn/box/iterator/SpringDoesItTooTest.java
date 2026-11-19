package com.patterns2learn.box.iterator;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class SpringDoesItTooTest {
    @Autowired JdbcClient jdbc;

    @Test void jdbcClientCanHandYouALazyStreamOverTheResultSet() {
        // @step:stream
        List<Integer> podium;
        try (Stream<Result> rows = jdbc.sql("select id, athlete, wod, seconds from result "
                    + "where wod = ? order by seconds, id")
                .param("fran")
                .query(Result.class)
                .stream()) {                               // rows are read as the stream is consumed…
            podium = rows.limit(3).map(Result::seconds).toList();
        }                                                  // …and closing it releases the ResultSet
        // @end
        assertThat(podium).containsExactly(151, 153, 155);
    }
}
