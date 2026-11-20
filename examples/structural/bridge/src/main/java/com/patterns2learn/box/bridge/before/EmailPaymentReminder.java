package com.patterns2learn.box.bridge.before;

import java.math.BigDecimal;
import java.time.LocalDate;

public class EmailPaymentReminder {
    private final BigDecimal amount;
    private final LocalDate due;

    public EmailPaymentReminder(BigDecimal amount, LocalDate due) {
        this.amount = amount;
        this.due = due;
    }

    public String text(String name) {
        return "Subject: Payment due\n\nHi " + name + ", your " + amount + " € membership fee is due on " + due + ".";
    }
}
