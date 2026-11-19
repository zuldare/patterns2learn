package com.patterns2learn.box.mediator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.HandlerAdapter;
import org.springframework.web.servlet.HandlerExceptionResolver;
import org.springframework.web.servlet.HandlerMapping;

@SpringBootTest
@AutoConfigureMockMvc
class SpringDoesItTooTest {
    @Autowired MockMvc mvc;
    // @step:dispatcher
    @Autowired List<HandlerMapping> mappings;              // which handler serves this URL?
    @Autowired List<HandlerAdapter> adapters;              // how do I call it?
    @Autowired List<HandlerExceptionResolver> resolvers;   // it failed: what do I answer?

    @Test void theDispatcherServletCoordinatesPartsThatDontKnowEachOther() throws Exception {
        mvc.perform(post("/api/floor/cap"))                // mapping → adapter → controller → exception → resolver
           .andExpect(status().isConflict())
           .andExpect(jsonPath("$.error").value("the WOD hasn't started"));
        // @end
        assertThat(mappings).isNotEmpty();
        assertThat(adapters).isNotEmpty();
        assertThat(resolvers).isNotEmpty();
    }
}
