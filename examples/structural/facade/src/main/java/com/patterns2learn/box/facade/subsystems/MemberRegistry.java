package com.patterns2learn.box.facade.subsystems;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Component;

/** Subsystem: who is a member of the box. */
@Component
public class MemberRegistry {
    private final AtomicLong ids = new AtomicLong();
    private final Map<String, Member> byEmail = new ConcurrentHashMap<>();
    private final Map<Long, Member> byId = new ConcurrentHashMap<>();

    public Member register(String name, String email) {
        Member m = new Member(ids.incrementAndGet(), name, email);
        if (byEmail.putIfAbsent(email, m) != null) throw new DuplicateMemberException();
        byId.put(m.id(), m);
        return m;
    }

    public void remove(long id) {
        Member m = byId.remove(id);
        if (m != null) byEmail.remove(m.email(), m);
    }

    public Optional<Member> find(long id) {
        return Optional.ofNullable(byId.get(id));
    }

    public Optional<Member> findByEmail(String email) {
        return Optional.ofNullable(byEmail.get(email));
    }
}
