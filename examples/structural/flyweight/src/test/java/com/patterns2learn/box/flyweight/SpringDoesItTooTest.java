package com.patterns2learn.box.flyweight;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.util.MimeType;
import org.springframework.util.MimeTypeUtils;

class SpringDoesItTooTest {
    @Test void theJdkAndSpringHandBackSharedInstances() {
        // @step:shared
        Integer a = Integer.valueOf(100), b = Integer.valueOf(100);
        assertThat(a).isSameAs(b);                                    // -128..127 come from a cache

        MimeType json1 = MimeTypeUtils.parseMimeType("application/json");
        MimeType json2 = MimeTypeUtils.parseMimeType("application/json");
        assertThat(json1).isSameAs(json2);                            // parsed once, then shared
        // @end
    }
}
