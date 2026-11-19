package com.patterns2learn.box.iterator;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** The aggregate: all the box's results. It doesn't hand out a list; it hands out a way to walk them. */
@Repository
public class ResultHistory {
    private final JdbcClient jdbc;
    private final int pageSize;
    private final AtomicInteger pagesFetched = new AtomicInteger();

    @Autowired
    public ResultHistory(JdbcClient jdbc) {
        this(jdbc, 50);
    }

    ResultHistory(JdbcClient jdbc, int pageSize) {
        if (pageSize < 1 || pageSize > 500) throw new IllegalArgumentException("page size must be between 1 and 500");
        this.jdbc = jdbc;
        this.pageSize = pageSize;
    }

    // @step:aggregate
    /** Every result of a WOD, fastest first. Each for-each loop gets its own iterator. */
    public Iterable<Result> fastest(String wod) {
        return () -> new PagedResultIterator(pageSize, (after, size) -> page(wod, after, size));
    }
    // @end

    private List<Result> page(String wod, Result after, int size) {
        pagesFetched.incrementAndGet();
        if (after == null) {
            return jdbc.sql("select id, athlete, wod, seconds from result where wod = ? order by seconds, id limit ?")
                .params(wod, size).query(Result.class).list();
        }
        return jdbc.sql("""
                select id, athlete, wod, seconds from result
                where wod = ? and (seconds > ? or (seconds = ? and id > ?))
                order by seconds, id limit ?""")
            .params(wod, after.seconds(), after.seconds(), after.id(), size)
            .query(Result.class).list();
    }

    /** How many pages have been read from the database (to show the walk is lazy). */
    int pagesFetched() {
        return pagesFetched.get();
    }
}
