package com.patterns2learn.box.proxy.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.patterns2learn.box.proxy.BoxDb;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class BookingApiTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcClient jdbc;

    @BeforeEach void reset() {
        BoxDb.reset(jdbc, 1);
    }

    @Test void booksAndThenTheClassIsFull() throws Exception {
        mvc.perform(post("/api/sessions/1/bookings").param("athlete", "Ana"))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.sessionId").value(1))
           .andExpect(jsonPath("$.athlete").value("Ana"));
        mvc.perform(post("/api/sessions/1/bookings").param("athlete", "Leo"))
           .andExpect(status().isConflict())
           .andExpect(jsonPath("$.error").value("class is full: 1"));
    }

    @Test void unknownSessionIs404() throws Exception {
        mvc.perform(post("/api/sessions/7/bookings").param("athlete", "Ana"))
           .andExpect(status().isNotFound())
           .andExpect(jsonPath("$.error").value("unknown session: 7"));
    }

    @Test void blankOrOverlongAthleteIs400() throws Exception {
        mvc.perform(post("/api/sessions/1/bookings").param("athlete", " "))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("athlete name is required"));
        mvc.perform(post("/api/sessions/1/bookings").param("athlete", "x".repeat(81)))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("athlete name is too long (max 80)"));
    }

    @Test void bookingTheSameClassTwiceIs409() throws Exception {
        BoxDb.reset(jdbc, 2);
        mvc.perform(post("/api/sessions/1/bookings").param("athlete", "Ana")).andExpect(status().isCreated());
        mvc.perform(post("/api/sessions/1/bookings").param("athlete", "Ana"))
           .andExpect(status().isConflict())
           .andExpect(jsonPath("$.error").value("already booked: Ana"));
        org.assertj.core.api.Assertions.assertThat(BoxDb.bookings(jdbc)).isEqualTo(1);
    }
}
