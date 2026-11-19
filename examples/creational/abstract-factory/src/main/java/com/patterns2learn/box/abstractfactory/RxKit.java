package com.patterns2learn.box.abstractfactory;

import org.springframework.stereotype.Component;

// @step:rx
/** A concrete factory: the Rx family, as written in the WOD. */
@Component("rx")
public class RxKit implements DivisionKit {
    @Override public Barbell barbell()     { return new Barbell(43); }
    @Override public PullVariant pull()    { return new PullVariant("pull-ups"); }
    @Override public Scorecard scorecard() { return new TimedScorecard("Rx", 10); }
}
// @end
