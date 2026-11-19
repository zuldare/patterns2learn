package com.patterns2learn.box.adapter;

import com.patterns2learn.box.adapter.vendor.pulseband.PulseBandClient;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** The box's original bands. Active unless another vendor is configured. */
@Configuration
@ConditionalOnProperty(name = "box.monitors.vendor", havingValue = "pulseband", matchIfMissing = true)
class PulseBandConfig {
    @Bean
    PulseBandClient pulseBandClient() {
        return new PulseBandClient();
    }

    @Bean
    HeartRateMonitor pulseBandMonitor(PulseBandClient client) {
        return new PulseBandMonitor(client, Map.of("ana", "PB-0042"));
    }
}
