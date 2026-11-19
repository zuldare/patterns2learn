package com.patterns2learn.box.builder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class SpringDoesItTooTest {
    @Autowired RestClient.Builder builder;
    @Autowired RestClient.Builder another;

    @Test void bootHandsYouAFreshBuilderForEachInjection() {
        assertThat(builder).isNotSameAs(another);   // prototype: your settings never leak into someone else's client
    }

    @Test void youFinishTheBuilderAndGetAClient() {
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo("https://leaderboard.example/wods/fran/top"))
              .andExpect(header("X-Box", "patterns2learn"))
              .andRespond(withSuccess("Ana 2:58", MediaType.TEXT_PLAIN));

        // @step:rest-client
        RestClient leaderboard = builder              // injected by Spring Boot, already configured
            .baseUrl("https://leaderboard.example")
            .defaultHeader("X-Box", "patterns2learn")
            .build();

        String top = leaderboard.get().uri("/wods/{wod}/top", "fran").retrieve().body(String.class);
        // @end
        assertThat(top).isEqualTo("Ana 2:58");
        server.verify();
    }

    @Test void uriComponentsBuilderBuildsUrisStepByStep() {
        String uri = UriComponentsBuilder.fromUriString("https://box.example")
            .path("/api/sessions/{id}")
            .queryParam("lang", "es")
            .buildAndExpand(7)
            .toUriString();
        assertThat(uri).isEqualTo("https://box.example/api/sessions/7?lang=es");
    }
}
