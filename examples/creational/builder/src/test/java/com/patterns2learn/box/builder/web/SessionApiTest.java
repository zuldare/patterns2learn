package com.patterns2learn.box.builder.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class SessionApiTest {
    @Autowired MockMvc mvc;

    @Test void schedulingASessionAnswers201WithItsLocation() throws Exception {
        String location = mvc.perform(post("/api/sessions?utm=app").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Hyrox prep\",\"startsAt\":\"18:00\",\"coach\":\"Ana\",\"beginnerFriendly\":true,\"waitlist\":true}"))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.session.minutes").value(60))
           .andExpect(jsonPath("$.session.waitlist").value(true))
           .andExpect(jsonPath("$.session.startsAt").value("18:00:00"))
           .andReturn().getResponse().getHeader("Location");
        assertThat(location).matches("http://localhost/api/sessions/\\d+");   // no query string carried over
        mvc.perform(get(location)).andExpect(status().isOk()).andExpect(jsonPath("$.session.coach").value("Ana"));
        mvc.perform(get("/api/sessions/999999")).andExpect(status().isNotFound());
    }

    @Test void templatesAreScheduledToo() throws Exception {
        mvc.perform(post("/api/sessions/templates/beginner").param("startsAt", "19:00").param("coach", "Ana"))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.session.name").value("Beginners"));
        mvc.perform(post("/api/sessions/templates/zen").param("startsAt", "19:00"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("unknown template: zen"));
        mvc.perform(post("/api/sessions/templates/beginner").param("startsAt", "19:00").param("coach", ""))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("a beginner-friendly class needs a coach"));   // empty form field = no coach
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
        mvc.perform(post("/api/sessions").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"WOD\",\"startsAt\":\"18:00\",\"minutes\":60.5}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("malformed request body"));   // no silent truncation to 60
    }

    @Test void templateParametersAreValidatedWithTheUsualErrorShape() throws Exception {
        mvc.perform(post("/api/sessions/templates/beginner").param("startsAt", "late"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("invalid value for startsAt"));
        mvc.perform(post("/api/sessions/templates/beginner"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("missing parameter startsAt"));
    }
}
