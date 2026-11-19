package com.patterns2learn.box.state.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional   // each test rolls back its changes to the memberships table
class MembershipApiTest {
    @Autowired MockMvc mvc;

    @Test void freezeThenCheckInIsRefused() throws Exception {
        // @step:request
        mvc.perform(post("/api/memberships/1/freeze"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.state").value("FROZEN"));
        mvc.perform(post("/api/memberships/1/check-in"))
           .andExpect(status().isConflict())
           .andExpect(jsonPath("$.error").value("membership is frozen: resume it first"));
        // @end
        mvc.perform(get("/api/memberships/1")).andExpect(jsonPath("$.state").value("FROZEN"));
    }

    @Test void aTrialCountsItsVisits() throws Exception {
        mvc.perform(post("/api/memberships/2/check-in"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.trialVisitsLeft").value(2));
    }

    @Test void errorsKeepTheUsualShape() throws Exception {
        mvc.perform(post("/api/memberships/9/renew"))
           .andExpect(status().isNotFound())
           .andExpect(jsonPath("$.error").value("unknown membership: 9"));
        mvc.perform(post("/api/memberships/1/teleport"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("unknown action: teleport"));
        mvc.perform(post("/api/memberships/abc/renew"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("invalid value for id"));
    }
}
