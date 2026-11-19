package com.patterns2learn.box.builder.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "box.schedule.max-sessions=1")
@AutoConfigureMockMvc
class FullScheduleApiTest {
    @Autowired MockMvc mvc;

    @Test void aFullScheduleIs409() throws Exception {
        mvc.perform(post("/api/sessions/templates/open-gym").param("startsAt", "12:00")).andExpect(status().isCreated());
        mvc.perform(post("/api/sessions/templates/open-gym").param("startsAt", "13:00"))
           .andExpect(status().isConflict())
           .andExpect(jsonPath("$.error").value("the schedule is full"));
    }
}
