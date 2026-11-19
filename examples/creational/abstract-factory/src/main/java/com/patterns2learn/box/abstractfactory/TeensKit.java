package com.patterns2learn.box.abstractfactory;

import org.springframework.stereotype.Component;

/** And one more family, for the teens class. */
@Component("teens")
public class TeensKit implements DivisionKit {
    @Override public Barbell barbell()     { return new Barbell(20); }
    @Override public PullVariant pull()    { return new PullVariant("ring rows"); }
    @Override public Scorecard scorecard() { return new Scorecard("Teens", 12); }
}
