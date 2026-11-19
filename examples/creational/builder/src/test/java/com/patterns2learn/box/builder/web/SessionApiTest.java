package com.patterns2learn.box.builder.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
class SessionApiTest {
    @Autowired MockMvc mvc;

    @Test void schedulingASessionAnswers201WithItsLocation() throws Exception {
        mvc.perform(post("/api/sessions").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Hyrox prep\",\"startsAt\":\"18:00\",\"coach\":\"Ana\",\"beginnerFriendly\":true}"))
           .andExpect(status().isCreated())
           .andExpect(header().string("Location", "http://localhost/api/sessions/1"))
           .andExpect(jsonPath("$.id").value(1))
           .andExpect(jsonPath("$.session.minutes").value(60))
           .andExpect(jsonPath("$.session.startsAt").value("18:00:00"));
        mvc.perform(get("/api/sessions/1")).andExpect(status().isOk()).andExpect(jsonPath("$.session.coach").value("Ana"));
        mvc.perform(get("/api/sessions/2")).andExpect(status().isNotFound());
    }

    @Test void templatesAreScheduledToo() throws Exception {
        mvc.perform(post("/api/sessions/templates/beginner").param("startsAt", "19:00").param("coach", "Ana"))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.session.name").value("Beginners"));
        mvc.perform(post("/api/sessions/templates/zen").param("startsAt", "19:00"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("unknown template: zen"));
    }

    @Test void invalidSessionsAre400WithTheReason() throws Exception {
        mvc.perform(post("/api/sessions").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"WOD\",\"startsAt\":\"18:00\",\"capacity\":0}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("capacity must be between 1 and 30"));
        mvc.perform(post("/api/sessions").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"WOD\"}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("start time is required"));
        mvc.perform(post("/api/sessions").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"WOD\",\"startsAt\":\"six\"}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("malformed request body"));
        mvc.perform(post("/api/sessions/templates/beginner").param("startsAt", "late"))
           .andExpect(status().isBadRequest());
    }
}
