package com.patterns2learn.box.interpreter;

// @step:terminal
/** Terminal expression: "10 burpees". */
public record Movement(int reps, String name) implements WodExpression {
    @Override
    public void interpret(Tally tally, long factor) {
        tally.add(name, reps * factor);
    }
}
// @end
