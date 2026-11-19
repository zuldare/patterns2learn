package com.patterns2learn.box.templatemethod;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ResultRepository {
    private final JdbcTemplate jdbc;

    public ResultRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void save(Result r) {
        jdbc.update("INSERT INTO result (athlete, wod, score) VALUES (?, ?, ?)", r.athlete(), r.wod(), r.score());
    }

    // @step:row-mapper
    public List<Result> findByWod(String wod) {
        // JdbcTemplate runs the fixed part (connection, statement, loop, close, error translation);
        // you only supply the SQL and how to turn one row into a Result
        return jdbc.query(
            "SELECT athlete, wod, score FROM result WHERE wod = ? ORDER BY score",
            (rs, rowNum) -> new Result(rs.getString("athlete"), rs.getString("wod"), rs.getInt("score")),
            wod);
    }
    // @end
}
