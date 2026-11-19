package com.patterns2learn.box.abstractfactory;

// @step:abstract-factory
/** The abstract factory: everything a WOD needs for one division, always from the same family. */
public interface DivisionKit {
    Barbell barbell();
    PullVariant pull();
    Scorecard scorecard();
}
// @end
