package com.patterns2learn.box.iterator.before;

import com.patterns2learn.box.iterator.Result;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;

/** Also before: the paging loop, written again in every report that needs to walk the results. */
public class OffsetLoopReport {
    private final JdbcClient jdbc;

    public OffsetLoopReport(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    // @step:offset-loop
    public int count(String wod) {
        int total = 0;
        for (int offset = 0; ; offset += 50) {                    // paging, by hand, here too
            List<Result> page = jdbc.sql("select id, athlete, wod, seconds from result where wod = ? "
                    + "order by seconds, id limit 50 offset ?")
                .params(wod, offset).query(Result.class).list();
            if (page.isEmpty()) break;
            total += page.size();
        }
        return total;
    }
    // @end
}
