package com.patterns2learn.box.chain;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.stereotype.Component;

/** In-memory box data: who's a member, who signed the waiver, how many spots each class has left. */
@Component
public class BoxRegistry {
    private final Set<String> activeMembers = Set.of("Ana", "Leo", "Bea", "Cris");
    private final Set<String> signedWaivers = Set.of("Ana", "Mia", "Bea", "Cris");
    private final Map<Long, AtomicInteger> spots = new ConcurrentHashMap<>(Map.of(1L, new AtomicInteger(2)));

    public boolean isActiveMember(String athlete) {
        return activeMembers.contains(athlete);
    }

    public boolean hasSignedWaiver(String athlete) {
        return signedWaivers.contains(athlete);
    }

    public boolean sessionExists(long sessionId) {
        return spots.containsKey(sessionId);
    }

    /** Takes one spot if any is left, atomically. */
    public boolean takeSpot(long sessionId) {
        AtomicInteger left = spots.get(sessionId);
        return left != null && left.getAndUpdate(n -> n > 0 ? n - 1 : n) > 0;
    }

    public int spotsLeft(long sessionId) {
        AtomicInteger left = spots.get(sessionId);
        return left == null ? 0 : left.get();
    }
}
