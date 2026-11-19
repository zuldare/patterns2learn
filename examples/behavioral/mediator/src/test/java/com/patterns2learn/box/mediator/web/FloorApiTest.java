package com.patterns2learn.box.mediator.web;

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
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)   // the floor's state is shared
class FloorApiTest {
    @Autowired MockMvc mvc;

    @Test void aWholeClass() throws Exception {
        // @step:request
        mvc.perform(post("/api/floor/start")).andExpect(status().isOk());
        mvc.perform(post("/api/floor/finish").contentType(MediaType.APPLICATION_JSON)
                .content("{\"athlete\":\"Ana\",\"seconds\":185}"))
           .andExpect(status().isOk());
        mvc.perform(post("/api/floor/cap")).andExpect(status().isOk());
        mvc.perform(get("/api/floor/screen")).andExpect(jsonPath("$[0]").value("1. Ana 3:05"));
        // @end
        mvc.perform(get("/api/floor/music")).andExpect(jsonPath("$[2]").value("stop"));
    }

    @Test void rulesAndValidationKeepTheUsualShape() throws Exception {
        mvc.perform(post("/api/floor/finish").contentType(MediaType.APPLICATION_JSON)
                .content("{\"athlete\":\"Ana\",\"seconds\":185}"))
           .andExpect(status().isConflict())
           .andExpect(jsonPath("$.error").value("the WOD hasn't started"));
        mvc.perform(post("/api/floor/start"));
        mvc.perform(post("/api/floor/finish").contentType(MediaType.APPLICATION_JSON)
                .content("{\"athlete\":\" \",\"seconds\":185}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("athlete is required"));
        mvc.perform(post("/api/floor/finish").contentType(MediaType.APPLICATION_JSON).content("{\"athlete\":"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("malformed request body"));
    }
}
