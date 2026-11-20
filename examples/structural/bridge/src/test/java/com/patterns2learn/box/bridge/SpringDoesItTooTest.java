package com.patterns2learn.box.bridge;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SpringDoesItTooTest {
    @LocalServerPort int port;

    @Test void theSameRestClientCodeRunsOverDifferentHttpTransports() {
        // @step:transports
        RestClient overJdk = RestClient.builder()
            .requestFactory(new JdkClientHttpRequestFactory())        // java.net.http.HttpClient underneath
            .baseUrl("http://localhost:" + port).build();
        RestClient overUrlConnection = RestClient.builder()
            .requestFactory(new SimpleClientHttpRequestFactory())     // HttpURLConnection underneath
            .baseUrl("http://localhost:" + port).build();

        String a = overJdk.get().uri("/api/reminders/channels").retrieve().body(String.class);
        String b = overUrlConnection.get().uri("/api/reminders/channels").retrieve().body(String.class);
        // @end
        assertThat(a).isEqualTo(b).contains("email", "sms", "push");
    }
}
