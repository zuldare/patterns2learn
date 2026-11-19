package com.patterns2learn.box.observer.before;

import com.patterns2learn.box.observer.LiftResult;
import com.patterns2learn.box.observer.PersonalRecordEvent;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

/** GoF Subject written by hand: it keeps its own list of observers and notifies them in a loop. Not thread-safe: a teaching sketch. */
public class ManualPrSubject {
    private record Key(String athlete, String lift) {}

    private final Map<Key, Integer> best = new HashMap<>();

    // @step:gof-subject
    private final List<PrObserver> observers = new ArrayList<>();

    public void subscribe(PrObserver observer) {
        observers.add(observer);
    }

    public boolean record(LiftResult r) {
        var key = new Key(r.athlete(), r.lift());
        Integer previous = best.get(key);
        boolean pr = previous == null || r.kg() > previous;
        if (pr) {
            best.put(key, r.kg());
            var event = new PersonalRecordEvent(r.athlete(), r.lift(), r.kg(), previous);
            for (PrObserver o : observers) {
                o.onRecord(event);   // the subject only knows the interface
            }
        }
        return pr;
    }
    // @end
}
