package com.patterns2learn.box.prototype;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Service;

@Service
public class WeekService {
    public record DayView(String day, List<String> movements) {}
    public record WeekView(long id, String name, List<DayView> days) {}

    private final ProgramLibrary library;
    private final AtomicLong ids = new AtomicLong();
    private final Map<Long, WeekProgram> weeks = new ConcurrentHashMap<>();

    public WeekService(ProgramLibrary library) {
        this.library = library;
    }

    public synchronized WeekView create(String template, String name) {
        if (weeks.size() >= 500) throw new InvalidProgramException("too many weeks stored");
        WeekProgram week = library.newWeek(template, name);
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
        return view(0, library.template(template));
    }

    private WeekProgram find(long id) {
        WeekProgram w = weeks.get(id);
        if (w == null) throw new UnknownWeekException(id);
        return w;
    }

    private static WeekView view(long id, WeekProgram w) {
        return new WeekView(id, w.name(), w.days().stream().map(d -> new DayView(d.day(), d.movements())).toList());
    }
}
