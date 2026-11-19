package com.patterns2learn.box.composite;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.CompositePropertySource;
import org.springframework.core.env.MapPropertySource;

class SpringDoesItTooTest {
    @Test void aCompositePropertySourceIsAPropertySourceMadeOfPropertySources() {
        // @step:property-sources
        var defaults = new MapPropertySource("box-defaults", Map.of("box.class.capacity", 12, "box.class.minutes", 60));
        var downtown = new MapPropertySource("downtown", Map.of("box.class.capacity", 20));

        var config = new CompositePropertySource("box");
        config.addPropertySource(downtown);                // asked first
        config.addPropertySource(defaults);

        Object capacity = config.getProperty("box.class.capacity");   // 20: downtown answers
        Object minutes = config.getProperty("box.class.minutes");     // 60: falls through to the defaults
        // @end
        assertThat(capacity).isEqualTo(20);
        assertThat(minutes).isEqualTo(60);

        var outer = new CompositePropertySource("outer");
        outer.addPropertySource(config);                   // a composite inside a composite
        assertThat(outer.getProperty("box.class.minutes")).isEqualTo(60);
        assertThat(outer.getPropertyNames()).contains("box.class.capacity", "box.class.minutes");
    }
}
