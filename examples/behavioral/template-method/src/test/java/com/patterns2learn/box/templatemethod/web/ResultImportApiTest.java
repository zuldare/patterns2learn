package com.patterns2learn.box.templatemethod.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.patterns2learn.box.templatemethod.Results;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ResultImportApiTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach void clear() {
        Results.clear(jdbc);
    }

    @Test void importsCsv() throws Exception {
        mvc.perform(post("/api/results/import").contentType("text/csv").content("athlete,wod,score\nAna,Fran,185\nLeo,Fran,0\n"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.imported").value(1))
           .andExpect(jsonPath("$.rejected[0]").value("Leo/Fran: score must be > 0"));
    }

    @Test void importsJson() throws Exception {
        mvc.perform(post("/api/results/import").contentType(MediaType.APPLICATION_JSON).content("[{\"athlete\":\"Mia\",\"wod\":\"Cindy\",\"score\":21}]"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.imported").value(1));
    }

    @Test void malformedPayloadIs400() throws Exception {
        mvc.perform(post("/api/results/import").contentType("text/csv").content("athlete,wod,score\nAna\n"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("line 2: expected athlete,wod,score"));
    }

    @Test void csvWithCharsetIsAccepted() throws Exception {
        mvc.perform(post("/api/results/import").contentType("text/csv;charset=UTF-8").content("athlete,wod,score\nAna,Fran,185\n"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.imported").value(1));
    }

    @Test void unsupportedTypeIs415() throws Exception {
        mvc.perform(post("/api/results/import").contentType(MediaType.APPLICATION_XML).content("<results/>"))
           .andExpect(status().isUnsupportedMediaType());
    }

    @Test void thePartnerCanPollItsLastReport() throws Exception {
        mvc.perform(post("/api/results/import").contentType(MediaType.APPLICATION_JSON).content("[{\"athlete\":\"Mia\",\"wod\":\"Cindy\",\"score\":21}]"))
           .andExpect(status().isOk());
        mvc.perform(get("/api/results/import/partner/last"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.imported").value(1));
    }
}
