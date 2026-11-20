package com.patterns2learn.box.flyweight.web;

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
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)   // the log is shared state
class SetApiTest {
    @Autowired MockMvc mvc;

    @Test void manySetsFewMovements() throws Exception {
        // @step:request
        for (String who : new String[] {"Ana", "Leo", "Eva"}) {
            mvc.perform(post("/api/sets").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"athlete\":\"" + who + "\",\"movement\":\"deadlift\",\"reps\":5,\"kg\":100}"))
               .andExpect(status().isCreated())
               .andExpect(jsonPath("$.line").value(who + " · 5 × deadlift @ 100 kg"));
        }
        mvc.perform(get("/api/sets/stats"))
           .andExpect(jsonPath("$.sets").value(3))
           .andExpect(jsonPath("$.movementsCreated").value(1));
        // @end
    }

    @Test void errorsKeepTheUsualShape() throws Exception {
        mvc.perform(post("/api/sets").contentType(MediaType.APPLICATION_JSON).content("{\"athlete\":\"Ana\",\"movement\":\"yoga\",\"reps\":5,\"kg\":0}"))
           .andExpect(status().isNotFound()).andExpect(jsonPath("$.error").value("unknown movement: yoga"));
        mvc.perform(post("/api/sets").contentType(MediaType.APPLICATION_JSON).content("{\"athlete\":\"Ana\",\"movement\":\"deadlift\",\"reps\":0,\"kg\":0}"))
           .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("reps must be between 1 and 500"));
        mvc.perform(post("/api/sets").contentType(MediaType.APPLICATION_JSON).content("{\"athlete\":\"Ana\",\"movement\":\"deadlift\",\"reps\":5.5,\"kg\":0}"))
           .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("malformed request body"));
        mvc.perform(get("/api/sets/stats")).andExpect(jsonPath("$.sets").value(0)).andExpect(jsonPath("$.movementsCreated").value(0));
    }
}
