package com.patterns2learn.box.proxy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.aop.support.AopUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class BookingServiceTest {
    @Autowired BookingService bookings;
    @Autowired JdbcClient jdbc;

    @BeforeEach void reset() {
        BoxDb.reset(jdbc, 2);
    }

    @Test void booksASpot() {
        assertThat(bookings.book(1, "Ana")).isEqualTo(new Booking(1, "Ana"));
        assertThat(BoxDb.bookings(jdbc)).isEqualTo(1);
        assertThat(jdbc.sql("SELECT spots FROM wod_session WHERE id = 1").query(Integer.class).single()).isEqualTo(1);
    }

    @Test void aFullClassRollsBackTheBooking() {
        BoxDb.reset(jdbc, 0);
        // @step:rollback
        // what Spring injected is not BookingService itself but a proxy around it
        assertThat(AopUtils.isAopProxy(bookings)).isTrue();

        assertThatThrownBy(() -> bookings.book(1, "Ana")).isInstanceOf(ClassFullException.class);

        // the INSERT ran, the exception rolled it back: no half-made booking left
        assertThat(BoxDb.bookings(jdbc)).isZero();
        // @end
    }

    @Test void unknownSession() {
        assertThatThrownBy(() -> bookings.book(99, "Ana")).isInstanceOf(UnknownSessionException.class).hasMessage("unknown session: 99");
        assertThat(BoxDb.bookings(jdbc)).isZero();
    }
}
