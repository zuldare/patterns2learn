package com.patterns2learn.box.facade.subsystems;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Component;

/** Subsystem: plans, prices and the first month's charge. "tok_declined" simulates a rejected card. */
@Component
public class Billing {
    private static final Map<String, BigDecimal> PLANS = Map.of(
        "unlimited", new BigDecimal("89.00"),
        "3x-week", new BigDecimal("69.00"));
    private final List<BigDecimal> charges = new CopyOnWriteArrayList<>();

    public BigDecimal priceOf(String plan) {
        BigDecimal price = PLANS.get(plan);
        if (price == null) throw new UnknownPlanException(abbreviate(plan));
        return price;
    }

    public Subscription subscribe(long memberId, String plan, String paymentToken) {
        BigDecimal price = priceOf(plan);
        if ("tok_declined".equals(paymentToken)) throw new PaymentDeclinedException();
        charges.add(price);
        return new Subscription(memberId, plan, price);
    }

    public List<BigDecimal> charges() {
        return List.copyOf(charges);
    }

    private static String abbreviate(String s) {
        return s.length() <= 40 ? s : s.substring(0, 40) + "…";
    }
}
