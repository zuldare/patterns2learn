package com.patterns2learn.box.decorator;

import java.util.HashSet;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class MembershipQuoter {
    private final Membership basic;
    private final List<AddOn> addOns;

    // @step:quoter
    public MembershipQuoter(Membership basic, List<AddOn> addOns) {
        this.basic = basic;
        this.addOns = addOns;              // every AddOn bean, sorted by @Order
    }

    public Membership quote(List<String> requested) {
        validate(requested);
        Membership plan = basic;
        for (AddOn addOn : addOns) {
            if (requested.contains(addOn.name())) {
                plan = addOn.wrap(plan);   // one more layer around the plan
            }
        }
        return plan;
    }
    // @end

    private void validate(List<String> requested) {
        var seen = new HashSet<String>();
        for (String name : requested) {
            if (addOns.stream().noneMatch(a -> a.name().equals(name))) {
                throw new IllegalArgumentException("unknown add-on: " + name);
            }
            if (!seen.add(name)) {
                throw new IllegalArgumentException("repeated add-on: " + name);
            }
        }
    }
}
