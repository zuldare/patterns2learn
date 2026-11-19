package com.patterns2learn.box.abstractfactory;

import java.util.List;
import org.springframework.stereotype.Component;

/** The client: writes Fran with whatever kit it's given, without knowing which division it is. */
@Component
public class FranPlanner {
    // @step:client
    public WodCard plan(DivisionKit kit) {
        Barbell bar = kit.barbell();            // the three pieces come from one kit,
        PullVariant pull = kit.pull();          // so they always belong together
        Scorecard card = kit.scorecard();
        return new WodCard("Fran · " + card.tag(),
            List.of("21-15-9", bar.thrusters(), pull.name()),
            card.timeCapMinutes());
    }
    // @end
}
