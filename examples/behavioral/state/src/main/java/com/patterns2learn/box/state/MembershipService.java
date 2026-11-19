package com.patterns2learn.box.state;

import java.util.function.Consumer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MembershipService {
    private final MembershipRepository repository;

    public MembershipService(MembershipRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public MembershipView find(int id) {
        return MembershipView.of(load(id));
    }

    /** Loads the membership, lets its state handle the action and saves whatever state comes next. */
    @Transactional
    public MembershipView apply(int id, String action) {
        Consumer<Membership> step = switch (action) {
            case "check-in" -> Membership::checkIn;
            case "freeze" -> Membership::freeze;
            case "resume" -> Membership::resume;
            case "renew" -> Membership::renew;
            case "expire" -> Membership::expire;
            default -> throw new UnknownActionException(action.length() <= 20 ? action : action.substring(0, 20) + "…");
        };
        Membership m = load(id);
        MembershipState readState = m.state();
        int readVisits = m.trialVisitsUsed();
        step.accept(m);
        repository.save(m, readState, readVisits);   // refuses if another request got there first
        return MembershipView.of(m);
    }

    private Membership load(int id) {
        return repository.find(id).orElseThrow(() -> new UnknownMembershipException(id));
    }
}
