package com.patterns2learn.box.facade;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.ApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.Resource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class SpringDoesItTooTest {
    record MemberJoined(String name) {}

    @TestConfiguration
    static class Listener {
        final List<String> heard = new ArrayList<>();

        @EventListener
        void on(MemberJoined e) {
            heard.add(e.name());
        }
    }

    @Autowired ApplicationContext context;
    @Autowired Listener listener;

    @Test void oneInterfaceInFrontOfSeveralSubsystems() {
        // @step:context
        OnboardingFacade facade = context.getBean(OnboardingFacade.class);             // beans
        String hello = context.getMessage("welcome", new Object[] {"Ana"}, Locale.ENGLISH);  // messages
        Resource prices = context.getResource("classpath:messages.properties");       // resources
        context.publishEvent(new MemberJoined("Ana"));                                // events
        // @end
        assertThat(facade).isNotNull();
        assertThat(hello).isEqualTo("Welcome to the box, Ana!");
        assertThat(prices.exists()).isTrue();
        assertThat(listener.heard).containsExactly("Ana");
    }
}
