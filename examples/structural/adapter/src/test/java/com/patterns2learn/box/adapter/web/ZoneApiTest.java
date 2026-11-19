package com.patterns2learn.box.adapter.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.patterns2learn.box.adapter.vendor.heartlink.HeartLinkHub;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "box.monitors.vendor=heartlink")
@AutoConfigureMockMvc
class ZoneApiTest {
    @Autowired MockMvc mvc;
    @Autowired HeartLinkHub hub;

    @Test void anAthletesZone() throws Exception {
        hub.simulate(3, "HR=171;T=1700000000");
        mvc.perform(get("/api/zones/ana"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.athlete").value("Ana"))
           .andExpect(jsonPath("$.bpm").value(171))
           .andExpect(jsonPath("$.zone").value(5))
           .andExpect(jsonPath("$.at").value("2023-11-14T22:13:20Z"));
    }

    @Test void noSignalIs204AndUnknownAthleteIs404() throws Exception {
        mvc.perform(get("/api/zones/leo")).andExpect(status().isNoContent());
        mvc.perform(get("/api/zones/nobody"))
           .andExpect(status().isNotFound())
           .andExpect(jsonPath("$.error").value("unknown athlete: nobody"));
    }

    @Test void aBrokenBandIs502() throws Exception {
        hub.simulate(3, "garbage");
        mvc.perform(get("/api/zones/ana"))
           .andExpect(status().isBadGateway())
           .andExpect(jsonPath("$.error").value("the heart-rate band sent an unreadable reading"));
    }
}
