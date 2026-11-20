package com.patterns2learn.box.interpreter;

// @step:repeat
/** Nonterminal expression: "3 x ( … )". It interprets its body with the factor multiplied. */
public record Repeat(int times, WodExpression body) implements WodExpression {
    @Override
    public void interpret(Tally tally, long factor) {
        body.interpret(tally, factor * times);
    }
}
// @end
