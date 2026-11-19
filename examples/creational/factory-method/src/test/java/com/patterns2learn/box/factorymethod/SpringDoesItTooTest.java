package com.patterns2learn.box.factorymethod;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.FactoryBean;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

class SpringDoesItTooTest {
    // @step:factory-bean
    /** A bean whose job is to make another object: Spring calls getObject() and registers the result. */
    static class DailyWodFactoryBean implements FactoryBean<Workout> {
        @Override
        public Workout getObject() {
            return new Amrap(12, List.of("10 wall balls", "10 box jumps"));   // today's WOD, decided here
        }

        @Override
        public Class<?> getObjectType() {
            return Workout.class;
        }
    }
    // @end

    @Configuration
    static class Box {
        @Bean
        DailyWodFactoryBean dailyWod() {
            return new DailyWodFactoryBean();
        }
    }

    @Test void askingForTheBeanGivesYouWhatTheFactoryMade() {
        try (var context = new AnnotationConfigApplicationContext(Box.class)) {
            assertThat(context.getBean("dailyWod")).isInstanceOf(Amrap.class);                 // the product
            assertThat(context.getBean("&dailyWod")).isInstanceOf(DailyWodFactoryBean.class);  // the factory itself
            assertThat(context.getBean(Workout.class).summary()).isEqualTo("AMRAP 12': 10 wall balls, 10 box jumps");
        }
    }
}
