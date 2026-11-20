package com.patterns2learn.box.prototype.web;

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
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class WeekApiTest {
    @Autowired MockMvc mvc;

    @Test void copyATemplateAndChangeOneDay() throws Exception {
        // @step:request
        String location = mvc.perform(post("/api/weeks").contentType(MediaType.APPLICATION_JSON)
                .content("{\"template\":\"strength-block\",\"name\":\"Week 47\"}"))
           .andExpect(status().isCreated())
           .andReturn().getResponse().getHeader("Location");
        mvc.perform(put(location + "/days/Wed").contentType(MediaType.APPLICATION_JSON)
                .content("{\"movements\":[\"5x3 front squat\",\"EMOM 10' cleans\"]}"))
           .andExpect(jsonPath("$.days[2].movements[0]").value("5x3 front squat"));
        mvc.perform(get("/api/templates/strength-block"))
           .andExpect(jsonPath("$.days[2].movements[0]").value("5x5 back squat"));   // the template is untouched
        // @end
    }

    @Test void errorsKeepTheUsualShape() throws Exception {
        mvc.perform(post("/api/weeks").contentType(MediaType.APPLICATION_JSON).content("{\"template\":\"zen\",\"name\":\"W\"}"))
           .andExpect(status().isNotFound())
           .andExpect(jsonPath("$.error").value("unknown template: zen"));
        mvc.perform(post("/api/weeks").contentType(MediaType.APPLICATION_JSON).content("{\"template\":\"strength-block\",\"name\":\" \"}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("name is required"));
        mvc.perform(get("/api/weeks/999999")).andExpect(status().isNotFound()).andExpect(jsonPath("$.error").value("unknown week: 999999"));
        mvc.perform(post("/api/weeks").contentType(MediaType.APPLICATION_JSON).content("{\"template\":"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("malformed request body"));
    }
}
