package com.patterns2learn.box.bridge.before;

import java.math.BigDecimal;
import java.time.LocalDate;

/** The fourth combination. A push channel would add two more classes; a third kind of reminder, three more. */
public class SmsPaymentReminder {
    private final BigDecimal amount;
    private final LocalDate due;
    private final String note;

    public SmsPaymentReminder(BigDecimal amount, LocalDate due, String note) {
        this.amount = amount;
        this.due = due;
        this.note = note;
    }

    // @step:combinations
    public String text(String name) {
        // copied from SmsClassReminder… without the 160-character cut
        return "Payment due: Hi " + name + ", your " + amount + " € fee is due on " + due + ". " + note;
    }
    // @end
}
