package com.patterns2learn.box.iterator.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class LeaderboardApiTest {
    @Autowired MockMvc mvc;

    @Test void thePodium() throws Exception {
        // @step:request
        mvc.perform(get("/api/leaderboard/fran").param("top", "3"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.length()").value(3))
           .andExpect(jsonPath("$[0].rank").value(1))
           .andExpect(jsonPath("$[0].time").value("2:31"));
        // @end
    }

    @Test void limitsAndUnknownWods() throws Exception {
        mvc.perform(get("/api/leaderboard/fran").param("top", "0"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("top must be between 1 and 100"));
        mvc.perform(get("/api/leaderboard/murph")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/leaderboard/fran").param("top", "lots"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("invalid value for top"));
    }
}
