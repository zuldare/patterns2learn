package com.patterns2learn.box.visitor;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinitionVisitor;
import org.springframework.beans.factory.support.GenericBeanDefinition;

class SpringDoesItTooTest {
    @Test void aBeanDefinitionVisitorWalksEveryValueOfADefinition() {
        GenericBeanDefinition def = new GenericBeanDefinition();
        def.setBeanClassName("com.example.Box");
        def.getPropertyValues().add("coach", "${coach}");
        def.getConstructorArgumentValues().addGenericArgumentValue("${city}");

        // @step:bean-visitor
        Map<String, String> config = Map.of("coach", "Ana", "city", "Madrid");
        BeanDefinitionVisitor visitor = new BeanDefinitionVisitor(          // visits class name, properties,
            value -> value.startsWith("${") ? config.get(value.substring(2, value.length() - 1)) : value);
        visitor.visitBeanDefinition(def);                                    // constructor args, nested values…
        // @end

        assertThat(def.getPropertyValues().get("coach")).isEqualTo("Ana");
        assertThat(def.getConstructorArgumentValues().getGenericArgumentValues().getFirst().getValue()).isEqualTo("Madrid");
        assertThat(def.getBeanClassName()).isEqualTo("com.example.Box");
    }
}
