package com.patterns2learn.box.singleton;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

class SpringDoesItTooTest {
    @Test void beansAreSingletonsUnlessYouAskForPrototype() {
        try (var context = new AnnotationConfigApplicationContext(WodCatalog.class, WodTimer.class)) {
            // @step:scopes
            // Default scope: singleton, one instance per container
            assertThat(context.getBean(WodCatalog.class)).isSameAs(context.getBean(WodCatalog.class));

            // @Scope("prototype"): a fresh WodTimer every time you ask
            assertThat(context.getBean(WodTimer.class)).isNotSameAs(context.getBean(WodTimer.class));
            // @end
        }
    }
}
