package com.patterns2learn.box.facade.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = "box.cards.stock=10")
@AutoConfigureMockMvc
class MemberApiTest {
    @Autowired MockMvc mvc;

    private org.springframework.test.web.servlet.ResultActions join(String name, String email, String plan, String token) throws Exception {
        return mvc.perform(post("/api/members").contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"%s\",\"email\":\"%s\",\"plan\":\"%s\",\"paymentToken\":\"%s\"}".formatted(name, email, plan, token)));
    }

    @Test void joiningAnswers201AndTheKioskUsesTheSameFacade() throws Exception {
        // @step:request
        mvc.perform(post("/api/members").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Ana\",\"email\":\"ana.api@box.example\",\"plan\":\"unlimited\",\"paymentToken\":\"tok_visa\"}"))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.monthlyPrice").value(89.00))
           .andExpect(jsonPath("$.introClass").value("Saturday 10:00"));
        // @end
        mvc.perform(post("/api/kiosk/join").param("name", "Eva").param("email", "eva.kiosk@box.example")
                .param("plan", "3x-week").param("paymentToken", "tok_visa"))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.monthlyPrice").value(69.00));
    }

    @Test void errorsKeepTheUsualShapeAndTheRightStatus() throws Exception {
        join("Leo", "leo.api@box.example", "unlimited", "tok_declined")
           .andExpect(status().isPaymentRequired())
           .andExpect(jsonPath("$.error").value("payment declined"));
        join("Leo", "bad", "unlimited", "tok_visa")
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("a valid email is required"));
        join("Leo", "leo.dup@box.example", "unlimited", "tok_visa").andExpect(status().isCreated());
        join("Leo", "leo.dup@box.example", "unlimited", "tok_visa")
           .andExpect(status().isConflict())
           .andExpect(jsonPath("$.error").value("email already registered"));
        mvc.perform(post("/api/members").contentType(MediaType.APPLICATION_JSON).content("{\"name\":"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("malformed request body"));
        mvc.perform(post("/api/kiosk/join").param("name", "Eva"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("missing parameter email"));
    }
}
