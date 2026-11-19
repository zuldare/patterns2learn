package com.patterns2learn.box.adapter;

import com.patterns2learn.box.adapter.vendor.heartlink.HeartLinkHub;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// @step:config
/** The new straps: switch with box.monitors.vendor=heartlink. ZoneBoard doesn't change. */
@Configuration
@ConditionalOnProperty(name = "box.monitors.vendor", havingValue = "heartlink")
class HeartLinkConfig {
    @Bean
    HeartLinkHub heartLinkHub() {
        return new HeartLinkHub();
    }

    @Bean
    HeartRateMonitor heartLinkMonitor(HeartLinkHub hub) {
        return new HeartLinkMonitor(hub, Map.of("ana", 3));
    }
}
// @end
