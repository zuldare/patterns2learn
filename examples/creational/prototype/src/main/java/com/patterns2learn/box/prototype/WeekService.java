package com.patterns2learn.box.prototype;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

@Service
public class WeekService {
    public record DayView(String day, List<String> movements) {}
    /** id is null for a template: templates aren't stored weeks. */
    public record WeekView(Long id, String name, List<DayView> days) {}

    private final ProgramLibrary library;
    private final AtomicLong ids = new AtomicLong();
    private final Map<Long, WeekProgram> weeks = new HashMap<>();   // guarded by the methods' lock

    public WeekService(ProgramLibrary library) {
        this.library = library;
    }

    public synchronized WeekView create(String template, String name) {
        return store(library.newWeek(template, name));
    }

    /** Copy an existing week (last week, say) into a new one: the same copy(), on a stored week. */
    public synchronized WeekView copyWeek(long id, String name) {
        return store(find(id).copy().rename(name));
    }

    public List<String> templates() {
        return library.names();
    }

    private WeekView store(WeekProgram week) {
        if (weeks.size() >= 500) throw new InvalidProgramException("too many weeks stored");
        long id = ids.incrementAndGet();
        weeks.put(id, week);
        return view(id, week);
    }

    public synchronized WeekView changeDay(long id, String day, List<String> movements) {
        WeekProgram week = find(id);
        week.day(day).replace(movements);
        return view(id, week);
    }

    public synchronized WeekView get(long id) {
        return view(id, find(id));
    }

    public WeekView template(String template) {
        return view(null, library.template(template));
    }

    private WeekProgram find(long id) {
        WeekProgram w = weeks.get(id);
        if (w == null) throw new UnknownWeekException(id);
        return w;
    }

    private static WeekView view(Long id, WeekProgram w) {
        return new WeekView(id, w.name(), w.days().stream().map(d -> new DayView(d.day(), d.movements())).toList());
    }
}
