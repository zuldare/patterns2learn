package com.patterns2learn.box.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.HttpRequestHandler;
import org.springframework.web.servlet.HandlerAdapter;
import org.springframework.web.servlet.mvc.HttpRequestHandlerAdapter;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter;

@SpringBootTest
@AutoConfigureMockMvc
class SpringDoesItTooTest {
    // @step:handler-adapter
    @TestConfiguration
    static class OldSchool {
        @Bean("/legacy/ping")   // not a @RestController: a plain HttpRequestHandler, mapped by bean name
        HttpRequestHandler legacyPing() {
            return (request, response) -> response.getWriter().write("pong");
        }
    }

    @Autowired MockMvc mvc;
    @Autowired List<HandlerAdapter> adapters;

    @Test void oneDispatcherServletManyKindsOfHandler() throws Exception {
        mvc.perform(get("/legacy/ping")).andExpect(content().string("pong"));   // HttpRequestHandlerAdapter
        mvc.perform(get("/api/zones/leo")).andExpect(status().isNoContent());   // RequestMappingHandlerAdapter
        assertThat(adapters).hasAtLeastOneElementOfType(RequestMappingHandlerAdapter.class)
                            .hasAtLeastOneElementOfType(HttpRequestHandlerAdapter.class);
    }
    // @end
}
