package com.patterns2learn.box.singleton.before;

import com.patterns2learn.box.singleton.Wod;
import java.util.List;

/** Before: two consumers that each build their own catalog. */
public final class NaiveWiring {
    private NaiveWiring() {}

    // @step:naive-new
    public static class NaiveWodController {
        private final NaiveWodCatalog catalog = new NaiveWodCatalog(); // copy #1

        public List<Wod> list() { return catalog.all(); }
        public void add(Wod wod) { catalog.add(wod); }
    }

    public static class NaiveBookingService {
        private final NaiveWodCatalog catalog = new NaiveWodCatalog(); // copy #2

        public boolean canBook(String wod) { return catalog.contains(wod); }
    }
    // @end
}
