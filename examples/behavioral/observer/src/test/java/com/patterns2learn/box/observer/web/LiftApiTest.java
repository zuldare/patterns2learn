package com.patterns2learn.box.observer.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class LiftApiTest {
    @Autowired MockMvc mvc;

    @Test void recordsALiftAndShowsTheLeaderboard() throws Exception {
        mvc.perform(post("/api/lifts").contentType(MediaType.APPLICATION_JSON).content("{\"athlete\":\"Ana\",\"lift\":\"Back squat\",\"kg\":105}"))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.personalRecord").value(true));
        mvc.perform(get("/api/leaderboard").param("lift", "Back squat"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.Ana").value(105));
    }

    @Test void invalidLiftIs400() throws Exception {
        mvc.perform(post("/api/lifts").contentType(MediaType.APPLICATION_JSON).content("{\"athlete\":\"Ana\",\"lift\":\"Back squat\",\"kg\":0}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("kg must be > 0"));
    }

    @Test void missingFieldNegativeOrFractionalKgAndMalformedJsonAre400() throws Exception {
        mvc.perform(post("/api/lifts").contentType(MediaType.APPLICATION_JSON).content("{\"lift\":\"Clean\",\"kg\":70}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("athlete is required"));
        mvc.perform(post("/api/lifts").contentType(MediaType.APPLICATION_JSON).content("{\"athlete\":\"Ana\",\"lift\":\"Clean\",\"kg\":-5}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("kg must be > 0"));
        mvc.perform(post("/api/lifts").contentType(MediaType.APPLICATION_JSON).content("{\"athlete\":\"Ana\",\"lift\":\"Clean\",\"kg\":105.5}"))
           .andExpect(status().isBadRequest());
        mvc.perform(post("/api/lifts").contentType(MediaType.APPLICATION_JSON).content("{\"athlete\":"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("malformed request body"));
    }

    @Test void leaderboardNeedsALift() throws Exception {
        mvc.perform(get("/api/leaderboard"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("missing parameter: lift"));
        mvc.perform(get("/api/leaderboard").param("lift", "Snatch"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$").isEmpty());
    }
}
