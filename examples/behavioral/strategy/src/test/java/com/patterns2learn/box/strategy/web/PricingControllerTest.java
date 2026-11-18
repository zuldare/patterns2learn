package com.patterns2learn.box.strategy.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.patterns2learn.box.strategy.DropInPricing;
import com.patterns2learn.box.strategy.MonthlyPricing;
import com.patterns2learn.box.strategy.PricingService;
import com.patterns2learn.box.strategy.StudentPricing;
import com.patterns2learn.box.strategy.TenPackPricing;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PricingController.class)
@Import({PricingService.class, MonthlyPricing.class, TenPackPricing.class, DropInPricing.class, StudentPricing.class})
class PricingControllerTest {
    @Autowired MockMvc mvc;

    @Test void quotesAPlan() throws Exception {
        mvc.perform(get("/api/pricing/quote").param("plan", "ten-pack").param("sessions", "12"))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.plan").value("ten-pack"))
           .andExpect(jsonPath("$.sessions").value(12))
           .andExpect(jsonPath("$.amount").value("240.00"));
    }

    @Test void unknownPlanIs400() throws Exception {
        mvc.perform(get("/api/pricing/quote").param("plan", "yoga").param("sessions", "1"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("unknown plan: yoga"));
    }

    @Test void zeroSessionsIs400() throws Exception {
        mvc.perform(get("/api/pricing/quote").param("plan", "monthly").param("sessions", "0"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("sessions must be >= 1"));
    }
}
