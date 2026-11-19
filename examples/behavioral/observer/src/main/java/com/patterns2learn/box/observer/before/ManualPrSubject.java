package com.patterns2learn.box.observer.before;

import com.patterns2learn.box.observer.LiftResult;
import com.patterns2learn.box.observer.PersonalRecordEvent;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

/** GoF Subject written by hand: it keeps its own list of observers and notifies them in a loop. */
public class ManualPrSubject {
    private final Map<String, Integer> best = new HashMap<>();

    // @step:gof-subject
    private final List<PrObserver> observers = new CopyOnWriteArrayList<>();

    public void subscribe(PrObserver observer) {
        observers.add(observer);
    }

    public boolean record(LiftResult r) {
        Integer previous = best.get(r.athlete() + "|" + r.lift());
        boolean pr = previous == null || r.kg() > previous;
        if (pr) {
            best.put(r.athlete() + "|" + r.lift(), r.kg());
            var event = new PersonalRecordEvent(r.athlete(), r.lift(), r.kg(), previous);
            for (PrObserver o : observers) {
                o.onRecord(event);   // the subject only knows the interface
            }
        }
        return pr;
    }
    // @end
}
