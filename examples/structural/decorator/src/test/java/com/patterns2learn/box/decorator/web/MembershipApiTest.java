package com.patterns2learn.box.decorator.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class MembershipApiTest {
    @Autowired MockMvc mvc;

    @Test void quotesAPlanWithAddOns() throws Exception {
        mvc.perform(get("/api/memberships/quote").param("addOns", "physio", "nutrition"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.description").value("Basic + Physio + Nutrition"))
           .andExpect(jsonPath("$.monthlyFee").value("99.00"));
    }

    @Test void withoutAddOnsItIsTheBasicPlan() throws Exception {
        mvc.perform(get("/api/memberships/quote"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.monthlyFee").value("59.00"));
    }

    @Test void unknownAddOnIs400() throws Exception {
        mvc.perform(get("/api/memberships/quote").param("addOns", "sauna"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("unknown add-on: sauna"));
    }

    @Test void commaSeparatedFormWorks() throws Exception {
        mvc.perform(get("/api/memberships/quote").param("addOns", "physio,nutrition"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.monthlyFee").value("99.00"));
    }

    @Test void studentDiscountShowsInTheDescription() throws Exception {
        mvc.perform(get("/api/memberships/quote").param("addOns", "student,physio"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.description").value("Basic + Physio (student -20%)"))
           .andExpect(jsonPath("$.monthlyFee").value("67.20"));
    }

    @Test void repeatedOrEmptyNamesAre400() throws Exception {
        mvc.perform(get("/api/memberships/quote").param("addOns", "physio,physio"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("repeated add-on: physio"));
        mvc.perform(get("/api/memberships/quote").param("addOns", "physio,"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("empty add-on name"));
    }
}
