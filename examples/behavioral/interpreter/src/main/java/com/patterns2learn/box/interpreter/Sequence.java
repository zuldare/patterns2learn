package com.patterns2learn.box.interpreter;

import java.util.List;

/** Nonterminal expression: "a + b + c". */
public record Sequence(List<WodExpression> parts) implements WodExpression {
    public Sequence {
        parts = List.copyOf(parts);
    }

    @Override
    public void interpret(Tally tally, long factor) {
        for (WodExpression part : parts) part.interpret(tally, factor);
    }
}
