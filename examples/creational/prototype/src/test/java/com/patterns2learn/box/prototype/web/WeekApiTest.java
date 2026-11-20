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

    @Test void copyLastWeekAndChangeTheCopy() throws Exception {
        String week46 = mvc.perform(post("/api/weeks").contentType(MediaType.APPLICATION_JSON)
                .content("{\"template\":\"strength-block\",\"name\":\"Week 46\"}"))
           .andReturn().getResponse().getHeader("Location");
        String week47 = mvc.perform(post(week46 + "/copy").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Week 47\"}"))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.name").value("Week 47"))
           .andReturn().getResponse().getHeader("Location");
        mvc.perform(put(week47 + "/days/Wed").contentType(MediaType.APPLICATION_JSON).content("{\"movements\":[\"5x3 front squat\"]}"));
        mvc.perform(get(week46)).andExpect(jsonPath("$.days[2].movements[0]").value("5x5 back squat"));   // week 46 untouched
        mvc.perform(get("/api/templates")).andExpect(jsonPath("$[1]").value("strength-block"));
        mvc.perform(get("/api/templates/strength-block")).andExpect(jsonPath("$.id").doesNotExist());
    }

    @Test void dayEditsAreValidated() throws Exception {
        String week = mvc.perform(post("/api/weeks").contentType(MediaType.APPLICATION_JSON)
                .content("{\"template\":\"deload-week\",\"name\":\"Easy\"}"))
           .andReturn().getResponse().getHeader("Location");
        mvc.perform(put(week + "/days/Wed").contentType(MediaType.APPLICATION_JSON).content("{\"movements\":[]}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("a day needs 1 to 12 movements"));
        mvc.perform(put(week + "/days/Sun").contentType(MediaType.APPLICATION_JSON).content("{\"movements\":[\"rest\"]}"))
           .andExpect(status().isNotFound())
           .andExpect(jsonPath("$.error").value("no plan for Sun"));
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
