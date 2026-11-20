package com.patterns2learn.box.interpreter.web;

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
class WodApiTest {
    @Autowired MockMvc mvc;

    @Test void totalsForANestedWod() throws Exception {
        // @step:request
        mvc.perform(post("/api/wods/totals").contentType(MediaType.APPLICATION_JSON)
                .content("{\"wod\":\"2 x (3 x (5 pull-ups) + 10 burpees)\"}"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.totals.pull-ups").value(30))
           .andExpect(jsonPath("$.totals.burpees").value(20))
           .andExpect(jsonPath("$.reps").value(50));
        // @end
    }

    @Test void errorsKeepTheUsualShape() throws Exception {
        mvc.perform(post("/api/wods/totals").contentType(MediaType.APPLICATION_JSON).content("{\"wod\":\"3 x (10 burpees\"}"))
           .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("expected ')' at position 15"));
        mvc.perform(post("/api/wods/totals").contentType(MediaType.APPLICATION_JSON).content("{\"wod\":\"10 burpees \uD83D\uDE00\"}"))
           .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("unexpected '\uD83D\uDE00' at position 11"));
        mvc.perform(post("/api/wods/totals").contentType(MediaType.APPLICATION_JSON).content("{}"))
           .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("the workout is empty"));
        mvc.perform(post("/api/wods/totals").contentType(MediaType.APPLICATION_JSON).content("{\"wod\":"))
           .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("malformed request body"));
    }
}
