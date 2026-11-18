package com.patterns2learn.box.strategy;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

class SpringDoesItTooTest {
    @Test void delegatingPasswordEncoderPicksStrategyByPrefix() {
        // @step:delegating-encoder
        PasswordEncoder encoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
        String hash = encoder.encode("wod-2026");
        assertThat(hash).startsWith("{bcrypt}");
        assertThat(encoder.matches("wod-2026", hash)).isTrue();
        assertThat(encoder.matches("wod-2026", "{noop}wod-2026")).isTrue();
        // @end
    }
}
