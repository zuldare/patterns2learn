package com.patterns2learn.box.strategy;

import java.math.BigDecimal;
import java.math.RoundingMode;

public record Money(BigDecimal amount) {
    public Money {
        amount = amount.setScale(2, RoundingMode.HALF_UP);
    }

    public static Money eur(String value) {
        return new Money(new BigDecimal(value));
    }

    public Money times(int factor) {
        return new Money(amount.multiply(BigDecimal.valueOf(factor)));
    }

    public Money percentOff(int percent) {
        var remaining = BigDecimal.valueOf(100 - percent).movePointLeft(2);
        return new Money(amount.multiply(remaining));
    }
}
