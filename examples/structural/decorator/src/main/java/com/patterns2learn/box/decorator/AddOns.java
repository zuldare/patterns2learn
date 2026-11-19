package com.patterns2learn.box.decorator;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

/** The catalogue of options. Paid extras first; the student discount always last, around everything. */
@Configuration
public class AddOns {
    // @step:addon-beans
    @Bean @Order(10)
    AddOn physio() {
        return option("physio", PhysioAddOn::new);
    }

    @Bean @Order(20)
    AddOn nutrition() {
        return option("nutrition", NutritionAddOn::new);
    }

    @Bean @Order(30)
    AddOn openGym() {
        return option("open-gym", OpenGymAddOn::new);
    }

    @Bean @Order(Ordered.LOWEST_PRECEDENCE)   // a discount must wrap the final price
    AddOn student() {
        return option("student", StudentDiscount::new);
    }
    // @end

    private static AddOn option(String name, java.util.function.UnaryOperator<Membership> wrapper) {
        return new AddOn() {
            public String name() {
                return name;
            }

            public Membership wrap(Membership plan) {
                return wrapper.apply(plan);
            }
        };
    }
}
