package com.patterns2learn.box.interpreter;

// @step:expression
/** One rule of the WOD notation. Each kind of expression knows how to interpret itself. */
public sealed interface WodExpression permits Movement, Sequence, Repeat {
    /** Adds this expression's reps to the tally; factor is how many times the rounds around it repeat. */
    void interpret(Tally tally, long factor);
}
// @end
