package com.patterns2learn.box.memento.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)   // the draft is shared state
class DraftApiTest {
    @Autowired MockMvc mvc;

    @Test void clearTheBoardAndUndo() throws Exception {
        // @step:request
        mvc.perform(delete("/api/draft")).andExpect(jsonPath("$.movements").isEmpty());
        mvc.perform(post("/api/draft/undo"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.title").value("Fran"))
           .andExpect(jsonPath("$.timeCapMinutes").value(10));
        // @end
    }

    @Test void editsAreValidatedAndUndoNeedsHistory() throws Exception {
        mvc.perform(post("/api/draft/undo")).andExpect(status().isConflict()).andExpect(jsonPath("$.error").value("nothing to undo"));
        mvc.perform(put("/api/draft").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Grace\",\"movements\":[\"30 clean & jerks\"],\"timeCapMinutes\":0}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("time cap must be between 1 and 90 minutes"));
        mvc.perform(get("/api/draft")).andExpect(jsonPath("$.title").value("Fran"));   // a refused edit saves nothing
        mvc.perform(put("/api/draft").contentType(MediaType.APPLICATION_JSON).content("{\"title\":"))
           .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("malformed request body"));
    }
}
