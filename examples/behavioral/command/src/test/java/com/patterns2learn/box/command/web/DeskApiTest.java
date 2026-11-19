package com.patterns2learn.box.command.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)   // the desk's history is shared state
class DeskApiTest {
    @Autowired MockMvc mvc;

    @Test void bookUndoAndReadTheLog() throws Exception {
        // @step:request
        mvc.perform(post("/api/desk/bookings").contentType(MediaType.APPLICATION_JSON)
                .content("{\"session\":1,\"athlete\":\"Leo\"}"))
           .andExpect(status().isCreated());
        mvc.perform(post("/api/desk/undo"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.undone").value("book Leo into 18:00 WOD"));
        // @end
        mvc.perform(get("/api/desk/log"))
           .andExpect(jsonPath("$[0]").value("done: book Leo into 18:00 WOD"))
           .andExpect(jsonPath("$[1]").value("undone: book Leo into 18:00 WOD"));
        mvc.perform(post("/api/desk/undo"))
           .andExpect(status().isConflict())
           .andExpect(jsonPath("$.error").value("nothing to undo"));
    }

    @Test void cancelAndMove() throws Exception {
        mvc.perform(post("/api/desk/bookings").contentType(MediaType.APPLICATION_JSON).content("{\"session\":1,\"athlete\":\"Ana\"}"));
        mvc.perform(post("/api/desk/moves").contentType(MediaType.APPLICATION_JSON).content("{\"athlete\":\"Ana\",\"from\":1,\"to\":2}"))
           .andExpect(status().isOk());
        mvc.perform(delete("/api/desk/bookings").param("session", "2").param("athlete", "Ana"))
           .andExpect(status().isOk());
        mvc.perform(get("/api/desk/classes/2")).andExpect(jsonPath("$.athletes").isEmpty());
    }

    @Test void errorsKeepTheUsualShape() throws Exception {
        mvc.perform(post("/api/desk/bookings").contentType(MediaType.APPLICATION_JSON).content("{\"session\":9,\"athlete\":\"Leo\"}"))
           .andExpect(status().isNotFound())
           .andExpect(jsonPath("$.error").value("unknown class: 9"));
        mvc.perform(post("/api/desk/bookings").contentType(MediaType.APPLICATION_JSON).content("{\"session\":1,\"athlete\":\" \"}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("athlete is required"));
        mvc.perform(delete("/api/desk/bookings").param("session", "1").param("athlete", "Nobody"))
           .andExpect(status().isConflict())
           .andExpect(jsonPath("$.error").value("Nobody is not booked into 18:00 WOD"));
        mvc.perform(post("/api/desk/bookings").contentType(MediaType.APPLICATION_JSON).content("{\"session\":"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("malformed request body"));
        mvc.perform(delete("/api/desk/bookings").param("session", "1"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("missing parameter athlete"));
        mvc.perform(get("/api/desk/classes/7")).andExpect(status().isNotFound());
    }
}
