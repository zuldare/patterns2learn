package com.patterns2learn.box.interpreter;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;

/**
 * Turns text into the expression tree. GoF leaves parsing out of Interpreter; this small recursive-descent
 * parser follows the grammar one method per rule:
 *   sequence := term ('+' term)*
 *   term     := NUMBER ('x' '(' sequence ')' | WORD)
 * A WORD is one word, letters and inner hyphens ("air-squats"); whitespace includes tabs and new lines.
 */
@Component
public class WodParser {
    static final int MAX_LENGTH = 200;
    static final int MAX_DEPTH = 5;

    public WodExpression parse(String text) {
        if (text != null && text.length() > MAX_LENGTH) throw new InvalidWodException("the workout is at most " + MAX_LENGTH + " characters");
        if (text == null || text.isBlank()) throw new InvalidWodException("the workout is empty");
        Cursor c = new Cursor(text);
        WodExpression wod = sequence(c, 0);
        c.skipSpaces();
        if (!c.atEnd()) throw c.unexpected();
        return wod;
    }

    // @step:parser
    private WodExpression sequence(Cursor c, int depth) {
        List<WodExpression> parts = new ArrayList<>(List.of(term(c, depth)));
        while (c.accept('+')) parts.add(term(c, depth));
        return parts.size() == 1 ? parts.get(0) : new Sequence(parts);
    }

    private WodExpression term(Cursor c, int depth) {
        int n = c.number();
        String word = c.word();
        if (!word.equals("x")) return new Movement(n, word);              // "10 burpees"
        if (depth + 1 > MAX_DEPTH) throw new InvalidWodException("at most " + MAX_DEPTH + " levels of rounds");
        c.expect('(');
        WodExpression body = sequence(c, depth + 1);
        c.expect(')');
        return new Repeat(n, body);                                        // "3 x ( … )"
    }
    // @end

    private static final class Cursor {
        private final String s;
        private int pos;

        Cursor(String s) {
            this.s = s;
        }

        void skipSpaces() {
            while (pos < s.length() && Character.isWhitespace(s.charAt(pos))) pos++;
        }

        boolean atEnd() {
            return pos >= s.length();
        }

        char peek() {
            return s.charAt(pos);
        }

        boolean accept(char ch) {
            skipSpaces();
            if (!atEnd() && peek() == ch) {
                pos++;
                return true;
            }
            return false;
        }

        void expect(char ch) {
            if (accept(ch)) return;
            if (!atEnd() && Character.isLetter(peek())) throw unexpected();
            throw new InvalidWodException("expected '" + ch + "' at position " + pos);
        }

        /** The error for whatever sits at the cursor; a letter means a movement name with spaces. */
        InvalidWodException unexpected() {
            if (Character.isLetter(peek())) return new InvalidWodException("movement names are one word (use hyphens) at position " + pos);
            String ch = new String(Character.toChars(s.codePointAt(pos)));       // whole emoji, never half
            return new InvalidWodException("unexpected '" + ch + "' at position " + pos);
        }

        int number() {
            skipSpaces();
            int start = pos;
            while (!atEnd() && Character.isDigit(peek())) pos++;
            if (start == pos) throw new InvalidWodException("expected a number at position " + start);
            String digits = s.substring(start, pos);
            String significant = digits.replaceFirst("^0+", "");
            int n = significant.isEmpty() ? 0 : significant.length() > 4 ? Integer.MAX_VALUE : Integer.parseInt(significant);
            if (n < 1 || n > 1000) throw new InvalidWodException("numbers must be between 1 and 1000 at position " + start);
            return n;
        }

        String word() {
            skipSpaces();
            int start = pos;
            // letters, and hyphens only between letters: "pull-ups", never "pull-"
            while (!atEnd() && (Character.isLetter(peek())
                    || (pos > start && peek() == '-' && pos + 1 < s.length() && Character.isLetter(s.charAt(pos + 1))))) pos++;
            if (start == pos) throw new InvalidWodException("expected a movement or 'x' at position " + start);
            return s.substring(start, pos).toLowerCase(Locale.ROOT);
        }
    }
}
