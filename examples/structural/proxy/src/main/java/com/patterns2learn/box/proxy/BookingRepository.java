package com.patterns2learn.box.proxy;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Two separate writes per booking: exactly what needs a transaction around it. */
@Repository
public class BookingRepository {
    private final JdbcClient jdbc;

    public BookingRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public boolean sessionExists(long sessionId) {
        return jdbc.sql("SELECT COUNT(*) FROM wod_session WHERE id = ?").param(sessionId).query(Integer.class).single() > 0;
    }

    public void insertBooking(long sessionId, String athlete) {
        jdbc.sql("INSERT INTO booking (session_id, athlete) VALUES (?, ?)").params(sessionId, athlete).update();
    }

    public void deleteBooking(long sessionId, String athlete) {
        jdbc.sql("DELETE FROM booking WHERE session_id = ? AND athlete = ?").params(sessionId, athlete).update();
    }

    /** Takes one spot if any is left; returns false when the class is already full. */
    public boolean takeSpot(long sessionId) {
        return jdbc.sql("UPDATE wod_session SET spots = spots - 1 WHERE id = ? AND spots > 0").param(sessionId).update() == 1;
    }

    public void releaseSpot(long sessionId) {
        jdbc.sql("UPDATE wod_session SET spots = spots + 1 WHERE id = ?").param(sessionId).update();
    }
}
