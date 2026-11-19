package com.patterns2learn.box.composite.web;

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
class WodApiTest {
    @Autowired MockMvc mvc;

    @Test void aBenchmarkWodWithItsTotals() throws Exception {
        // @step:request
        mvc.perform(get("/api/wods/murph"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.reps").value(600))       // 20 × (5 + 10 + 15)
           .andExpect(jsonPath("$.minutes").value(46))     // 2 runs + 600 reps
           .andExpect(jsonPath("$.board[2]").value("  20 rounds"));
        // @end
        mvc.perform(get("/api/wods/fran"))
           .andExpect(status().isNotFound())
           .andExpect(jsonPath("$.error").value("unknown WOD: fran"));
    }

    @Test void anyTreeCanBeEstimated() throws Exception {
        mvc.perform(post("/api/wods/estimate").contentType(MediaType.APPLICATION_JSON).content("""
                {"type":"block","title":"Ladder","times":3,"parts":[
                  {"type":"block","times":2,"parts":[{"type":"movement","name":"burpees","reps":5}]},
                  {"type":"run","meters":200}]}"""))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.reps").value(30))
           .andExpect(jsonPath("$.board[0]").value("Ladder · 3 rounds"));
    }

    @Test void brokenJsonTreesAre400() throws Exception {
        mvc.perform(post("/api/wods/estimate").contentType(MediaType.APPLICATION_JSON).content("{\"meters\":400}"))
           .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("malformed request body"));
        mvc.perform(post("/api/wods/estimate").contentType(MediaType.APPLICATION_JSON).content("{\"type\":\"block\",\"times\":2,\"parts\":[null]}"))
           .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("a block part cannot be empty"));
        mvc.perform(post("/api/wods/estimate").contentType(MediaType.APPLICATION_JSON).content("{\"type\":\"block\",\"times\":2,\"parts\":null}"))
           .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("a block needs 1 to 10 parts"));
        mvc.perform(post("/api/wods/estimate").contentType(MediaType.APPLICATION_JSON).content("{\"type\":\"block\",\"parts\":[{\"type\":\"run\",\"meters\":400}]}"))
           .andExpect(status().isBadRequest());
        String deep = "{\"type\":\"run\",\"meters\":400}";
        for (int i = 0; i < 5; i++) deep = "{\"type\":\"block\",\"times\":1,\"parts\":[" + deep + "]}";
        mvc.perform(post("/api/wods/estimate").contentType(MediaType.APPLICATION_JSON).content(deep))
           .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("blocks can nest at most 4 levels"));
    }

    @Test void invalidTreesAre400WithTheReason() throws Exception {
        mvc.perform(post("/api/wods/estimate").contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"block\",\"times\":0,\"parts\":[{\"type\":\"run\",\"meters\":400}]}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("rounds must be between 1 and 50"));
        mvc.perform(post("/api/wods/estimate").contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"swim\",\"meters\":400}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("malformed request body"));
        mvc.perform(post("/api/wods/estimate").contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"movement\",\"name\":\"burpees\",\"reps\":5.5}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("malformed request body"));
    }
}
