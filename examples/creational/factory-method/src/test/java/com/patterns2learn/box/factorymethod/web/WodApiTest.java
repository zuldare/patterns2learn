package com.patterns2learn.box.factorymethod.web;

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

    @Test void plansAWod() throws Exception {
        mvc.perform(post("/api/wods/plan").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Fran\",\"format\":\"for-time\",\"minutes\":8,\"movements\":[\"21-15-9 thrusters\",\"pull-ups\"]}"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.summary").value("For time (cap 8'): 21-15-9 thrusters, pull-ups"))
           .andExpect(jsonPath("$.lowerIsBetter").value(true));
    }

    @Test void unknownFormatIs400() throws Exception {
        mvc.perform(post("/api/wods/plan").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Yoga\",\"format\":\"zen\",\"minutes\":30,\"movements\":[\"breathe\"]}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("unknown format: zen"));
    }

    @Test void invalidRequestIs400() throws Exception {
        mvc.perform(post("/api/wods/plan").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Cindy\",\"format\":\"amrap\",\"minutes\":0,\"movements\":[\"burpees\"]}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("minutes must be between 1 and 90"));
    }

    @Test void missingFieldsOrNonNumericMinutesAre400() throws Exception {
        mvc.perform(post("/api/wods/plan").contentType(MediaType.APPLICATION_JSON)
                .content("{\"format\":\"amrap\",\"minutes\":20,\"movements\":[\"burpees\"]}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("name is required"));
        mvc.perform(post("/api/wods/plan").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Cindy\",\"format\":\"amrap\",\"minutes\":20}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("at least one movement is required"));
        mvc.perform(post("/api/wods/plan").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Cindy\",\"format\":\"amrap\",\"minutes\":\"twenty\",\"movements\":[\"burpees\"]}"))
           .andExpect(status().isBadRequest());
    }
}
