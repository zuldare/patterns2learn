package com.patterns2learn.box.observer.before;

import com.patterns2learn.box.observer.LiftResult;
import java.util.HashMap;
import java.util.Map;

/** Before: the service knows, builds and calls every party interested in a PR. */
public class CoupledResultService {
    private record Key(String athlete, String lift) {}

    private final Map<Key, Integer> best = new HashMap<>();
    private final Notifier notifier;
    private final Leaderboard leaderboard;
    private final Badges badges;

    public CoupledResultService(Notifier notifier, Leaderboard leaderboard, Badges badges) {
        this.notifier = notifier;
        this.leaderboard = leaderboard;
        this.badges = badges;
    }

    // @step:coupled
    public boolean record(LiftResult r) {
        var key = new Key(r.athlete(), r.lift());
        boolean pr = r.kg() > best.getOrDefault(key, 0);
        if (pr) {
            notifier.send(r.athlete() + ": new PR!");   // one more line for every new feature...
            leaderboard.update(r.lift(), r.athlete(), r.kg());
            badges.award(r.athlete(), "PR club");         // ...and if this one throws, nothing below runs
            best.put(key, r.kg());
        }
        return pr;
    }
    // @end

    public int bestOf(String athlete, String lift) {
        return best.getOrDefault(new Key(athlete, lift), 0);
    }

    public static class Notifier {
        public void send(String message) {}
    }

    public static class Leaderboard {
        public void update(String lift, String athlete, int kg) {}
    }

    public static class Badges {
        private final boolean down;

        public Badges(boolean down) {
            this.down = down;
        }

        public void award(String athlete, String badge) {
            if (down) throw new IllegalStateException("badge service unavailable");
        }
    }
}
