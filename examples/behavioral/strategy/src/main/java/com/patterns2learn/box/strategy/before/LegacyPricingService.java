package com.patterns2learn.box.strategy.before;

import com.patterns2learn.box.strategy.Money;
import com.patterns2learn.box.strategy.UnknownPlanException;

public class LegacyPricingService {
    // @step:legacy-switch
    public Money quote(String plan, int sessions) {
        switch (plan) {
            case "monthly":
                return Money.eur("79.00");
            case "ten-pack":
                return Money.eur("120.00").times((sessions + 9) / 10);
            case "drop-in":
                return Money.eur("15.00").times(sessions);
            // student discount? yet another case here...
            default:
                throw new UnknownPlanException(plan);
        }
    }
    // @end
}
