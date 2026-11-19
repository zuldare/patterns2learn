package com.patterns2learn.box.decorator;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

class SpringDoesItTooTest {
    static final List<String> audit = new ArrayList<>();

    /** A decorator that writes down every fee it's asked for. */
    record AuditedMembership(Membership inner) implements Membership {
        public String description() {
            return inner.description();
        }

        public Money monthlyFee() {
            audit.add("fee asked for " + inner.description());
            return inner.monthlyFee();
        }
    }

    // @step:bpp
    static class AuditEveryMembership implements BeanPostProcessor {
        @Override
        public Object postProcessAfterInitialization(Object bean, String beanName) {
            // Spring offers every bean it creates: return a wrapper and that's what gets injected
            return bean instanceof Membership m ? new AuditedMembership(m) : bean;
        }
    }
    // @end

    @Test void aBeanPostProcessorCanWrapEveryBeanInADecorator() {
        audit.clear();
        try (var context = new AnnotationConfigApplicationContext(BasicMembership.class, AuditEveryMembership.class)) {
            Membership plan = context.getBean(Membership.class);
            assertThat(plan).isInstanceOf(AuditedMembership.class);
            assertThat(plan.monthlyFee()).isEqualTo(Money.eur("59.00"));
            assertThat(audit).containsExactly("fee asked for Basic");
        }
    }
}
