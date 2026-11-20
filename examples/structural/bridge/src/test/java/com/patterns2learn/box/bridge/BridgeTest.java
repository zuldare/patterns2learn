package com.patterns2learn.box.bridge;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.patterns2learn.box.bridge.channels.Channel;
import com.patterns2learn.box.bridge.channels.EmailChannel;
import com.patterns2learn.box.bridge.channels.PushChannel;
import com.patterns2learn.box.bridge.channels.SmsChannel;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;

class BridgeTest {
    final Member ana = new Member("ana", "Ana", "ana@box.example", "+34600000001", "device-ana");
    final SmsChannel sms = new SmsChannel();

    @Test void anyReminderGoesThroughAnyChannel() {
        // @step:combine
        Reminder classBySms = new ClassReminder(sms, "Hyrox prep", LocalTime.of(18, 0));
        Reminder payBySms = new PaymentReminder(sms, new BigDecimal("89.00"), LocalDate.of(2026, 12, 1));

        assertThat(classBySms.send(ana).text()).isEqualTo("Class tomorrow: Hyrox prep at 18:00. See you on the floor, Ana!");
        assertThat(payBySms.send(ana).to()).isEqualTo("+34600000001");
        // @end
    }

    @Test void everyCombinationWorksWithoutAClassPerCombination() {
        List<Channel> channels = List.of(new EmailChannel(), new SmsChannel(), new PushChannel());
        for (Channel c : channels) {
            assertThat(new ClassReminder(c, "Hyrox prep", LocalTime.of(18, 0)).send(ana).channel()).isEqualTo(c.name());
            assertThat(new PaymentReminder(c, new BigDecimal("89.00"), LocalDate.of(2026, 12, 1)).send(ana).channel()).isEqualTo(c.name());
        }
    }

    @Test void eachChannelAppliesItsOwnLimits() {
        Reminder longOne = new ClassReminder(sms, "x".repeat(120), LocalTime.of(7, 0));
        assertThat(longOne.send(ana).text()).hasSize(160).endsWith("…");
        Delivery push = new PaymentReminder(new PushChannel(), new BigDecimal("89.00"), LocalDate.of(2026, 12, 1)).send(ana);
        assertThat(push.to()).isEqualTo("device-ana");
        assertThat(push.text()).startsWith("Payment due | ");
        Delivery email = new PaymentReminder(new EmailChannel(), new BigDecimal("89.00"), LocalDate.of(2026, 12, 1)).send(ana);
        assertThat(email.text()).isEqualTo("Subject: Payment due\n\nHi Ana, your 89.00 € membership fee is due on 2026-12-01.");
    }

    @Test void remindersValidateTheirData() {
        assertThatThrownBy(() -> new ClassReminder(sms, " ", LocalTime.NOON)).isInstanceOf(InvalidReminderException.class).hasMessage("class name is required");
        assertThatThrownBy(() -> new PaymentReminder(sms, BigDecimal.ZERO, LocalDate.of(2026, 1, 1))).hasMessage("amount must be positive");
        assertThatThrownBy(() -> new ClassReminder(null, "WOD", LocalTime.NOON)).hasMessage("a reminder needs a channel");
    }
}
