package com.patterns2learn.box.builder;

import java.time.LocalTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ScheduleService {
    private final SessionTemplates templates;
    private final int maxSessions;
    private final AtomicLong ids = new AtomicLong();
    private final Map<Long, Scheduled> sessions = new ConcurrentHashMap<>();

    @Autowired
    public ScheduleService(SessionTemplates templates) {
        this(templates, 500);
    }

    ScheduleService(SessionTemplates templates, int maxSessions) {
        this.templates = templates;
        this.maxSessions = maxSessions;
    }

    // @step:schedule
    public Scheduled schedule(SessionRequest req) {
        ClassSession.Builder b = ClassSession.builder(req.name(), req.startsAt());
        if (req.minutes() != null) b.minutes(req.minutes());     // only what the coach sent;
        if (req.capacity() != null) b.capacity(req.capacity());  // the rest keeps its default
        if (req.coach() != null) b.coach(req.coach());
        if (Boolean.TRUE.equals(req.beginnerFriendly())) b.beginnerFriendly();
        if (Boolean.TRUE.equals(req.waitlist())) b.waitlist();
        return save(b.build());                                  // build() rejects an impossible class
    }
    // @end

    public Scheduled fromTemplate(String template, LocalTime startsAt, String coach) {
        return save(templates.build(template, startsAt, coach));
    }

    public Optional<Scheduled> find(long id) {
        return Optional.ofNullable(sessions.get(id));
    }

    private synchronized Scheduled save(ClassSession session) {
        if (sessions.size() >= maxSessions) throw new IllegalStateException("the schedule is full");
        Scheduled s = new Scheduled(ids.incrementAndGet(), session);
        sessions.put(s.id(), s);
        return s;
    }
}
