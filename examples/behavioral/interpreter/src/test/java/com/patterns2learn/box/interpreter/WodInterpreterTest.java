package com.patterns2learn.box.interpreter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;
import org.junit.jupiter.api.Test;

class WodInterpreterTest {
    final WodParser parser = new WodParser();

    @Test void nestedRoundsMultiplyAllTheWayDown() {
        // @step:interpret
        WodExpression wod = parser.parse("2 x (3 x (5 pull-ups) + 10 burpees)");
        Tally tally = new Tally();
        wod.interpret(tally, 1);

        assertThat(tally.totals()).containsExactly(Map.entry("pull-ups", 30), Map.entry("burpees", 20));
        // @end
        assertThat(tally.reps()).isEqualTo(50);
    }

    @Test void theTreeIsBuiltFromSmallExpressions() {
        // @step:tree
        WodExpression wod = new Repeat(3, new Sequence(java.util.List.of(
            new Movement(10, "burpees"),
            new Movement(15, "air-squats"))));
        Tally tally = new Tally();
        wod.interpret(tally, 1);
        assertThat(tally.reps()).isEqualTo(75);
        // @end
        assertThat(parser.parse("3 x (10 burpees + 15 air-squats)")).isEqualTo(wod);
    }

    @Test void tabsNewLinesAndLeadingZerosAreFine() {
        Tally tally = new Tally();
        parser.parse("3 x (10 burpees +\n\t015 air-squats)").interpret(tally, 1);
        assertThat(tally.totals()).containsExactly(Map.entry("burpees", 30), Map.entry("air-squats", 45));
    }

    @Test void sameMovementAddsUpAndCaseIsIgnored() {
        Tally tally = new Tally();
        parser.parse("10 Burpees + 2 x (5 burpees)").interpret(tally, 1);
        assertThat(tally.totals()).containsExactly(Map.entry("burpees", 20));
    }

    @Test void badNotationSaysWhereItBroke() {
        assertThatThrownBy(() -> parser.parse("3 x (10 burpees")).isInstanceOf(InvalidWodException.class).hasMessage("expected ')' at position 15");
        assertThatThrownBy(() -> parser.parse("x 10")).hasMessage("expected a number at position 0");
        assertThatThrownBy(() -> parser.parse("10")).hasMessage("expected a movement or 'x' at position 2");
        assertThatThrownBy(() -> parser.parse("10 burpees 5")).hasMessage("unexpected '5' at position 11");
        assertThatThrownBy(() -> parser.parse(" ")).hasMessage("the workout is empty");
        assertThatThrownBy(() -> parser.parse("0 burpees")).hasMessage("numbers must be between 1 and 1000 at position 0");
        assertThatThrownBy(() -> parser.parse("10 box jumps")).hasMessage("movement names are one word (use hyphens) at position 7");
        assertThatThrownBy(() -> parser.parse("3 x (10 box jumps)")).hasMessage("movement names are one word (use hyphens) at position 12");
        assertThatThrownBy(() -> parser.parse("10 burpees \uD83D\uDE00")).hasMessage("unexpected '\uD83D\uDE00' at position 11");
        assertThatThrownBy(() -> parser.parse("10 pull-")).hasMessage("unexpected '-' at position 7");
        assertThatThrownBy(() -> parser.parse("1 x (".repeat(6) + "1 burpee" + ")".repeat(6))).hasMessage("at most 5 levels of rounds");
        assertThatThrownBy(() -> parser.parse("x".repeat(201))).hasMessage("the workout is at most 200 characters");
    }

    @Test void hugeTotalsAreRefused() {
        Tally tally = new Tally();
        WodExpression wod = parser.parse("1000 x (1000 x (1000 burpees))");
        assertThatThrownBy(() -> wod.interpret(tally, 1)).isInstanceOf(InvalidWodException.class).hasMessage("the workout adds up to more than 100000 reps");
    }
}
