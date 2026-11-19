package com.patterns2learn.box.chain;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/** First in, last out: lets the rest of the chain decide, then writes down the outcome. */
@Component
@Order(0)
public class AuditRule implements AccessRule {
    private final List<String> log = new CopyOnWriteArrayList<>();

    // @step:audit
    @Override
    public AccessDecision check(CheckIn checkIn, AccessChain chain) {
        AccessDecision decision = chain.proceed(checkIn);   // everything after me runs here...
        log.add(checkIn.athlete() + " → session " + checkIn.sessionId() + ": "
            + (decision.granted() ? "granted" : "denied (" + decision.reason() + ")"));
        return decision;                                    // ...and I see the answer on the way back
    }
    // @end

    public List<String> log() {
        return List.copyOf(log);
    }
}
