package com.patterns2learn.box.bridge;

import com.patterns2learn.box.bridge.channels.Channel;
import java.math.BigDecimal;
import java.time.LocalDate;

/** Another refined abstraction: the membership fee. */
public class PaymentReminder extends Reminder {
    private final BigDecimal amount;
    private final LocalDate due;

    public PaymentReminder(Channel channel, BigDecimal amount, LocalDate due) {
        super(channel);
        if (amount == null || amount.signum() <= 0) throw new InvalidReminderException("amount must be positive");
        if (due == null) throw new InvalidReminderException("due date is required");
        this.amount = amount;
        this.due = due;
    }

    @Override protected String title() { return "Payment due"; }

    @Override protected String body(Member m) {
        return "Hi " + m.name() + ", your " + amount + " € membership fee is due on " + due + ".";
    }
}
