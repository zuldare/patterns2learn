package com.patterns2learn.box.chain.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class CheckInApiTest {
    @Autowired MockMvc mvc;

    @Test void grantedIs200() throws Exception {
        mvc.perform(post("/api/check-ins").param("athlete", "Ana").param("session", "1"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.granted").value(true));
    }

    @Test void deniedIs403WithTheReason() throws Exception {
        mvc.perform(post("/api/check-ins").param("athlete", "Leo").param("session", "1"))
           .andExpect(status().isForbidden())
           .andExpect(jsonPath("$.granted").value(false))
           .andExpect(jsonPath("$.reason").value("waiver not signed"));
    }

    @Test void blankAthleteIs400() throws Exception {
        mvc.perform(post("/api/check-ins").param("athlete", " ").param("session", "1"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("athlete is required"));
    }

    @Test void missingOrNonNumericSessionIs400WithTheUsualShape() throws Exception {
        mvc.perform(post("/api/check-ins").param("athlete", "Ana"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("missing parameter: session"));
        mvc.perform(post("/api/check-ins").param("athlete", "Ana").param("session", "evening"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("session must be a number"));
    }

    @Test void grantedHasNoReasonField() throws Exception {
        mvc.perform(post("/api/check-ins").param("athlete", "Ana").param("session", "1"))
           .andExpect(jsonPath("$.reason").doesNotExist());
    }
}
