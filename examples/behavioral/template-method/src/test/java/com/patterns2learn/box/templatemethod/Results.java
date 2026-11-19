package com.patterns2learn.box.templatemethod;

import org.springframework.jdbc.core.JdbcTemplate;

/** Test helper over the result table. */
public final class Results {
    private Results() {}

    public static void clear(JdbcTemplate jdbc) {
        jdbc.update("DELETE FROM result");
    }

    public static int count(JdbcTemplate jdbc) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM result", Integer.class);
    }
}
