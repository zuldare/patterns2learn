package com.patterns2learn.box.mediator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.handler;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.patterns2learn.box.mediator.web.FloorController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class SpringDoesItTooTest {
    @Autowired MockMvc mvc;

    @Test void theDispatcherServletPassesTheRequestFromOnePartToTheNext() throws Exception {
        // @step:dispatcher
        mvc.perform(post("/api/floor/finish").contentType(MediaType.APPLICATION_JSON)
                .content("{\"athlete\":\" \",\"seconds\":185}"))
           .andExpect(handler().handlerType(FloorController.class))       // a HandlerMapping found the handler
           .andExpect(handler().methodName("finish"))                     // a HandlerAdapter called it
           .andExpect(r -> assertThat(r.getResolvedException())           // a HandlerExceptionResolver took the failure
               .isInstanceOf(InvalidFinishException.class))
           .andExpect(status().isBadRequest());                           // …and turned it into the answer
        // @end
    }
}
