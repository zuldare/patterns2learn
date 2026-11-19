package com.patterns2learn.box.decorator;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Euros, always with two decimals. */
public record Money(BigDecimal amount) {
    public Money {
        amount = amount.setScale(2, RoundingMode.HALF_UP);
    }

    public static Money eur(String amount) {
        return new Money(new BigDecimal(amount));
    }

    public Money plus(Money other) {
        return new Money(amount.add(other.amount));
    }

    public Money times(String factor) {
        return new Money(amount.multiply(new BigDecimal(factor)));
    }

    @Override
    public String toString() {
        return amount.toPlainString();
    }
}
