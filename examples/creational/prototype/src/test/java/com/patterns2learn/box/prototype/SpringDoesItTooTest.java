package com.patterns2learn.box.prototype;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.support.AbstractBeanDefinition;
import org.springframework.beans.factory.support.GenericBeanDefinition;
import org.springframework.context.support.GenericApplicationContext;

class SpringDoesItTooTest {
    @Test void beanDefinitionsAreCopiedFromAPrototypeDefinition() {
        // @step:clone-definition
        GenericBeanDefinition base = new GenericBeanDefinition();
        base.setBeanClass(ArrayList.class);
        base.setScope(BeanDefinition.SCOPE_SINGLETON);

        AbstractBeanDefinition copy = base.cloneBeanDefinition();   // a copy of the definition…
        copy.setScope(BeanDefinition.SCOPE_PROTOTYPE);              // …changed without touching the original

        assertThat(base.getScope()).isEqualTo(BeanDefinition.SCOPE_SINGLETON);
        // @end
        assertThat(copy.getBeanClass()).isEqualTo(ArrayList.class);
    }

    @Test void prototypeScopeCreatesANewObjectEachTimeItDoesNotCloneOne() {
        try (var context = new GenericApplicationContext()) {
            GenericBeanDefinition def = new GenericBeanDefinition();
            def.setBeanClass(ArrayList.class);
            def.setScope(BeanDefinition.SCOPE_PROTOTYPE);
            context.registerBeanDefinition("list", def);
            context.refresh();
            @SuppressWarnings("unchecked") ArrayList<String> first = (ArrayList<String>) context.getBean("list");
            first.add("changed");
            @SuppressWarnings("unchecked") ArrayList<String> second = (ArrayList<String>) context.getBean("list");
            assertThat(second).isNotSameAs(first).isEmpty();   // built afresh, not copied
        }
    }
}
