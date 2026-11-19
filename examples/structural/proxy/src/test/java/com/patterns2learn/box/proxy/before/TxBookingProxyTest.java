package com.patterns2learn.box.proxy.before;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.patterns2learn.box.proxy.BookingRepository;
import com.patterns2learn.box.proxy.BoxDb;
import com.patterns2learn.box.proxy.ClassFullException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.PlatformTransactionManager;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class TxBookingProxyTest {
    @Autowired BookingRepository repo;
    @Autowired PlatformTransactionManager tx;
    @Autowired JdbcClient jdbc;

    @BeforeEach void reset() {
        BoxDb.reset(jdbc, 0);
    }

    @Test void theClientOnlySeesTheInterface() {
        BookingOperations ops = new TxBookingProxy(new PlainBookingService(repo), tx);
        assertThatThrownBy(() -> ops.book(1, "Ana")).isInstanceOf(ClassFullException.class);
        assertThat(BoxDb.bookings(jdbc)).isZero();
    }

    @Test void withoutTheProxyTheInsertStays() {
        BookingOperations plain = new PlainBookingService(repo);
        assertThatThrownBy(() -> plain.book(1, "Ana")).isInstanceOf(ClassFullException.class);
        assertThat(BoxDb.bookings(jdbc)).isEqualTo(1);
    }
}
