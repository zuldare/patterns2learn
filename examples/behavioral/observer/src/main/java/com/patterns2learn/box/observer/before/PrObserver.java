package com.patterns2learn.box.observer.before;

import com.patterns2learn.box.observer.PersonalRecordEvent;

/** GoF Observer: anyone who wants to hear about PRs implements this. */
@FunctionalInterface
public interface PrObserver {
    void onRecord(PersonalRecordEvent event);
}
