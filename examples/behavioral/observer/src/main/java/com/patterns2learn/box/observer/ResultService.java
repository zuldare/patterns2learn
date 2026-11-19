package com.patterns2learn.box.observer;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

@Service
public class ResultService {
    /** Athlete and lift as a real key: no string joining, so names can't collide. */
    private record Key(String athlete, String lift) {}

    private final Map<Key, Integer> best = new ConcurrentHashMap<>();
    private final ApplicationEventPublisher events;

    public ResultService(ApplicationEventPublisher events) {
        this.events = events;
    }

    // @step:publish
    public boolean record(LiftResult r) {
        Integer previous = keepBest(r);
        boolean pr = previous == null || r.kg() > previous;
        if (pr) {
            // announce it and move on: who reacts is none of this class's business
            events.publishEvent(new PersonalRecordEvent(r.athlete(), r.lift(), r.kg(), previous));
        }
        return pr;
    }
    // @end

    /** Stores the new best atomically and returns the previous one (null if this was the first lift). */
    private Integer keepBest(LiftResult r) {
        var previous = new AtomicReference<Integer>();
        best.compute(new Key(r.athlete(), r.lift()), (key, old) -> {
            previous.set(old);
            return old == null || r.kg() > old ? r.kg() : old;
        });
        return previous.get();
    }
}
