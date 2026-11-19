package com.patterns2learn.box.singleton;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
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

    /** A singleton that keeps one injected timer and also has a provider for fresh ones. */
    static class Coach {
        final WodTimer injectedOnce;
        final ObjectProvider<WodTimer> timers;

        Coach(WodTimer injectedOnce, ObjectProvider<WodTimer> timers) {
            this.injectedOnce = injectedOnce;
            this.timers = timers;
        }
    }

    @Test void aPrototypeInjectedIntoASingletonIsCreatedOnlyOnce() {
        try (var context = new AnnotationConfigApplicationContext(WodTimer.class, Coach.class)) {
            Coach coach = context.getBean(Coach.class);
            assertThat(coach.injectedOnce).isSameAs(context.getBean(Coach.class).injectedOnce);
            assertThat(coach.timers.getObject()).isNotSameAs(coach.timers.getObject());
        }
    }
}
