package com.patterns2learn.box.proxy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class SelfInvocationTest {
    @Autowired BookingService bookings;
    @Autowired JdbcClient jdbc;

    @BeforeEach void oneSpotLeft() {
        BoxDb.reset(jdbc, 1);
    }

    @Test void callingBookFromInsideTheServiceSkipsTheProxy() {
        // @step:self-call-leak
        // bookPair calls this.book(...) twice: those calls never pass through the proxy
        assertThatThrownBy(() -> bookings.bookPair(1, "Ana", "Leo")).isInstanceOf(ClassFullException.class);

        // no transaction, no rollback: Leo's booking row stayed although the class was full
        assertThat(BoxDb.bookings(jdbc)).isEqualTo(2);
        // @end
    }
}
