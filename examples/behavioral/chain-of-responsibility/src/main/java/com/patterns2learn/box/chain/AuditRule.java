package com.patterns2learn.box.chain;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/** First in, last out: lets the rest of the chain decide, then writes down the outcome. */
// @step:audit
@Component
@Order(0)
public class AuditRule implements AccessRule {
    /** Only the latest entries are kept, so a long-running door doesn't grow this forever. */
    public static final int KEEP = 100;

    private final Deque<String> log = new ArrayDeque<>();

    @Override
    public AccessDecision check(CheckIn checkIn, AccessChain chain) {
        AccessDecision decision = chain.proceed(checkIn);   // everything after me runs here...
        record(checkIn.athlete() + " → session " + checkIn.sessionId() + ": "
            + (decision.granted() ? "granted" : "denied (" + decision.reason() + ")"));
        return decision;                                    // ...and I see the answer on the way back
    }
    // @end

    private synchronized void record(String entry) {
        if (log.size() == KEEP) log.removeFirst();
        log.addLast(entry);
    }

    public synchronized List<String> log() {
        return List.copyOf(log);
    }
}
