package com.patterns2learn.box.proxy;

import org.springframework.jdbc.core.simple.JdbcClient;

/** Test helper: puts the 18:00 Fran class back to a known state. */
public final class BoxDb {
    private BoxDb() {}

    public static void reset(JdbcClient jdbc, int spots) {
        jdbc.sql("DELETE FROM booking").update();
        jdbc.sql("UPDATE wod_session SET spots = ? WHERE id = 1").param(spots).update();
    }

    public static int bookings(JdbcClient jdbc) {
        return jdbc.sql("SELECT COUNT(*) FROM booking").query(Integer.class).single();
    }
}
