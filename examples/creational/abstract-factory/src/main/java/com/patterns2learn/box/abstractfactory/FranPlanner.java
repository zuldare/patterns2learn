package com.patterns2learn.box.abstractfactory;

import java.util.List;
import org.springframework.stereotype.Component;

/** The client: writes Fran with whatever kit it's given, without knowing which division it is. */
@Component
public class FranPlanner {
    public static final int FRAN_REPS = 90;   // 21-15-9 of two movements

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

    /** Scores a result with the division's own scorecard. */
    public String score(DivisionKit kit, int seconds, int reps) {
        Scorecard card = kit.scorecard();
        int cap = card.timeCapMinutes() * 60;
        if (seconds < 1 || seconds > cap) throw new InvalidResultException("time must be between 1 and " + cap + " seconds");
        if (reps < 0 || reps > FRAN_REPS) throw new InvalidResultException("reps must be between 0 and " + FRAN_REPS);
        return card.score(seconds, reps, FRAN_REPS);
    }
}
