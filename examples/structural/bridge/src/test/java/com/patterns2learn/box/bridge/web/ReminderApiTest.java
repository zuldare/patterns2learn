package com.patterns2learn.box.bridge.web;

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
class ReminderApiTest {
    @Autowired MockMvc mvc;

    @Test void eachMemberGetsItThroughTheirChannel() throws Exception {
        // @step:request
        mvc.perform(post("/api/reminders").contentType(MediaType.APPLICATION_JSON)
                .content("{\"member\":\"leo\",\"kind\":\"class\"}"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.channel").value("sms"))
           .andExpect(jsonPath("$.to").value("+34600000002"));
        // @end
        mvc.perform(post("/api/reminders").contentType(MediaType.APPLICATION_JSON)
                .content("{\"member\":\"leo\",\"kind\":\"payment\",\"channel\":\"email\"}"))
           .andExpect(jsonPath("$.channel").value("email"));
    }

    @Test void errorsKeepTheUsualShape() throws Exception {
        mvc.perform(post("/api/reminders").contentType(MediaType.APPLICATION_JSON).content("{\"member\":\"nobody\",\"kind\":\"class\"}"))
           .andExpect(status().isNotFound()).andExpect(jsonPath("$.error").value("unknown member: nobody"));
        mvc.perform(post("/api/reminders").contentType(MediaType.APPLICATION_JSON).content("{\"member\":\"ana\",\"kind\":\"party\"}"))
           .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("kind must be class or payment"));
        mvc.perform(post("/api/reminders").contentType(MediaType.APPLICATION_JSON).content("{\"member\":\"ana\",\"kind\":\"class\",\"channel\":\"fax\"}"))
           .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("unknown channel: fax"));
        mvc.perform(post("/api/reminders").contentType(MediaType.APPLICATION_JSON).content("{\"member\":"))
           .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("malformed request body"));
    }
}
