package com.patterns2learn.box.iterator.before;

import com.patterns2learn.box.iterator.Result;
import java.util.Comparator;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;

/** Before: load every result into memory, sort, keep three. */
public class LoadEverythingLeaderboard {
    private final JdbcClient jdbc;
    private int rowsRead;

    public LoadEverythingLeaderboard(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    // @step:load-all
    public List<Result> top(String wod, int n) {
        List<Result> all = jdbc.sql("select id, athlete, wod, seconds from result where wod = ?")
            .param(wod).query(Result.class).list();               // every row of the WOD, in memory
        rowsRead = all.size();
        return all.stream().sorted(Comparator.comparingInt(Result::seconds)).limit(n).toList();
    }
    // @end

    public int rowsRead() {
        return rowsRead;
    }
}
