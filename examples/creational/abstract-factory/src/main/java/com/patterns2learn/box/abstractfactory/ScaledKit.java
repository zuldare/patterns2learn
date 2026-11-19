package com.patterns2learn.box.abstractfactory;

import org.springframework.stereotype.Component;

/** Another concrete factory: lighter bar, an easier pull, a bit more time. */
@Component("scaled")
public class ScaledKit implements DivisionKit {
    @Override public Barbell barbell()     { return new Barbell(29); }
    @Override public PullVariant pull()    { return new PullVariant("jumping pull-ups"); }
    @Override public Scorecard scorecard() { return new Scorecard("Scaled", 12); }
}
