package com.patterns2learn.box.bridge;

import com.patterns2learn.box.bridge.channels.Channel;
import java.math.BigDecimal;
import java.time.LocalDate;

/** Another refined abstraction: the membership fee. */
public class PaymentReminder extends Reminder {
    private final BigDecimal amount;
    private final LocalDate due;
    private final String note;

    public PaymentReminder(Channel channel, BigDecimal amount, LocalDate due) {
        this(channel, amount, due, null);
    }

    /** The note is optional: a line from the front desk, at most 200 characters. */
    public PaymentReminder(Channel channel, BigDecimal amount, LocalDate due, String note) {
        super(channel);
        if (amount == null || amount.signum() <= 0) throw new InvalidReminderException("amount must be positive");
        if (due == null) throw new InvalidReminderException("due date is required");
        this.amount = amount;
        if (note != null && note.strip().length() > 200) throw new InvalidReminderException("note is at most 200 characters");
        this.due = due;
        this.note = note == null || note.isBlank() ? null : note.strip();
    }

    @Override protected String title() { return "Payment due"; }

    @Override protected String body(Member m) {
        return "Hi " + m.name() + ", your " + amount + " € membership fee is due on " + due + "." + (note == null ? "" : " " + note);
    }
}
