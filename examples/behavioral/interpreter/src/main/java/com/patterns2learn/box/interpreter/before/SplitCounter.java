package com.patterns2learn.box.interpreter.before;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Before: string tricks. One level of rounds works; anything nested falls through the cracks. */
public class SplitCounter {
    private static final Pattern ROUNDS = Pattern.compile("^(\\d+) x \\((.*)\\)$");
    private static final Pattern MOVEMENT = Pattern.compile("^(\\d+) ([a-z-]+)$");

    // @step:split
    public Map<String, Integer> count(String wod) {
        int rounds = 1;
        String body = wod.strip();
        Matcher m = ROUNDS.matcher(body);
        if (m.matches()) { rounds = Integer.parseInt(m.group(1)); body = m.group(2); }
        Map<String, Integer> totals = new LinkedHashMap<>();
        for (String part : body.split("\\+")) {
            Matcher mv = MOVEMENT.matcher(part.strip());
            if (mv.matches()) totals.merge(mv.group(2), Integer.parseInt(mv.group(1)) * rounds, Integer::sum);
            // "3 x (5 pull-ups)" doesn't match: skipped without a word
        }
        return totals;
    }
    // @end
}
