package com.patterns2learn.box.interpreter;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.expression.spel.SpelNode;
import org.springframework.expression.spel.standard.SpelExpression;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.SimpleEvaluationContext;

class SpringDoesItTooTest {
    public record Round(int reps, int rounds) {}

    @Test void spelParsesIntoATreeOfNodesThatEvaluateThemselves() {
        // @step:spel
        SpelExpression expr = (SpelExpression) new SpelExpressionParser().parseExpression("reps * rounds + 10");
        SpelNode root = expr.getAST();                       // OpPlus( OpMultiply(reps, rounds), 10 )

        var ctx = SimpleEvaluationContext.forReadOnlyDataBinding().build();
        Integer total = expr.getValue(ctx, new Round(15, 3), Integer.class);
        // @end
        assertThat(root.getClass().getSimpleName()).isEqualTo("OpPlus");
        assertThat(root.getChild(0).getClass().getSimpleName()).isEqualTo("OpMultiply");
        assertThat(total).isEqualTo(55);
    }
}
