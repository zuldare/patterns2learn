package com.patterns2learn.box.abstractfactory.web;

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
class WodApiTest {
    @Autowired MockMvc mvc;

    @Test void franForEachDivision() throws Exception {
        // @step:request
        mvc.perform(get("/api/wods/fran").param("division", "scaled"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.title").value("Fran · Scaled"))
           .andExpect(jsonPath("$.lines[1]").value("thrusters 29 kg"))
           .andExpect(jsonPath("$.lines[2]").value("jumping pull-ups"))
           .andExpect(jsonPath("$.timeCapMinutes").value(12));
        // @end
        mvc.perform(get("/api/wods/fran")).andExpect(jsonPath("$.title").value("Fran · Rx"));
        mvc.perform(get("/api/wods/fran").param("division", "teens")).andExpect(jsonPath("$.lines[2]").value("ring rows"));
    }

    @Test void scoringDependsOnTheDivision() throws Exception {
        mvc.perform(get("/api/wods/fran/score").param("division", "teens").param("seconds", "412").param("reps", "90"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.score").value("90 reps Teens"));
        mvc.perform(get("/api/wods/fran/score").param("seconds", "700").param("reps", "90"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("time must be between 1 and 600 seconds"));
        mvc.perform(get("/api/wods/fran/score").param("seconds", "100"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("missing parameter reps"));
    }

    @Test void anUnknownDivisionIs400() throws Exception {
        mvc.perform(get("/api/wods/fran").param("division", "masters"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("unknown division: masters"));
    }
}
