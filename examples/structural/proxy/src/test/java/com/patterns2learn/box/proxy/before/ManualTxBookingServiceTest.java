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
class ManualTxBookingServiceTest {
    @Autowired BookingRepository repo;
    @Autowired PlatformTransactionManager tx;
    @Autowired JdbcClient jdbc;

    @BeforeEach void reset() {
        BoxDb.reset(jdbc, 0);
    }

    @Test void rollsBackByHand() {
        var service = new ManualTxBookingService(repo, tx);
        assertThatThrownBy(() -> service.book(1, "Ana")).isInstanceOf(ClassFullException.class);
        assertThat(BoxDb.bookings(jdbc)).isZero();
    }

    @Test void cancelRepeatsTheSameCeremony() {
        BoxDb.reset(jdbc, 1);
        var service = new ManualTxBookingService(repo, tx);
        service.book(1, "Ana");
        service.cancel(1, "Ana");
        assertThat(BoxDb.bookings(jdbc)).isZero();
    }
}
