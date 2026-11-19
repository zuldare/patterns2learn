package com.patterns2learn.box.facade.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "box.cards.stock=0")
@AutoConfigureMockMvc
class OutOfCardsApiTest {
    @Autowired MockMvc mvc;

    @Test void noCardsLeftIs409() throws Exception {
        mvc.perform(post("/api/kiosk/join").param("name", "Eva").param("email", "eva@box.example")
                .param("plan", "unlimited").param("paymentToken", "tok_visa"))
           .andExpect(status().isConflict())
           .andExpect(jsonPath("$.error").value("no access cards left"));
    }
}
