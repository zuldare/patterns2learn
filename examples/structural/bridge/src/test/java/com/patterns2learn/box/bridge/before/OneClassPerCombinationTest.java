package com.patterns2learn.box.bridge.before;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import org.junit.jupiter.api.Test;

class OneClassPerCombinationTest {
    @Test void fourClassesForTwoKindsAndTwoChannelsAndTheyDrifted() {
        String classSms = new SmsClassReminder("x".repeat(200), LocalTime.of(7, 0)).text("Ana");
        String paySms = new SmsPaymentReminder(new BigDecimal("89.00"), LocalDate.of(2026, 12, 1), "y".repeat(200)).text("Ana");
        assertThat(classSms).hasSize(160);                        // this one truncates…
        assertThat(paySms.length()).isGreaterThan(160);           // …this copy forgot to
        assertThat(new EmailClassReminder("WOD", LocalTime.NOON).text("Ana")).startsWith("Subject:");
        assertThat(new EmailPaymentReminder(new BigDecimal("89.00"), LocalDate.of(2026, 12, 1)).text("Ana")).startsWith("Subject:");
    }
}
