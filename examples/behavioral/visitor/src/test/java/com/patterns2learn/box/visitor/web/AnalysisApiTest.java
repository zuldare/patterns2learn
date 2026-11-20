package com.patterns2learn.box.visitor.web;

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
class AnalysisApiTest {
    @Autowired MockMvc mvc;

    @Test void analyseAWod() throws Exception {
        // @step:request
        mvc.perform(post("/api/wods/analysis").contentType(MediaType.APPLICATION_JSON).content("""
                [{"type":"lift","name":"deadlift","kg":100,"reps":15},
                 {"type":"cardio","machine":"row","meters":1000},
                 {"type":"gymnastics","name":"burpees","reps":30}]"""))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.equipment[1]").value("rower"))
           .andExpect(jsonPath("$.calories").value(102));
        // @end
    }

    @Test void invalidElementsAre400() throws Exception {
        mvc.perform(post("/api/wods/analysis").contentType(MediaType.APPLICATION_JSON)
                .content("[{\"type\":\"cardio\",\"machine\":\"swim\",\"meters\":500}]"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("machine must be row, bike, ski or run"));
        mvc.perform(post("/api/wods/analysis").contentType(MediaType.APPLICATION_JSON).content("[]"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("a workout needs 1 to 20 elements"));
        mvc.perform(post("/api/wods/analysis").contentType(MediaType.APPLICATION_JSON).content("[{\"type\":\"yoga\"}]"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("malformed request body"));
    }
}
