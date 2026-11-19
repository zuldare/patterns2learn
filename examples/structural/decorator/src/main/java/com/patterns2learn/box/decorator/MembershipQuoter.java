package com.patterns2learn.box.decorator;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class MembershipQuoter {
    private final Membership basic;
    private final List<AddOn> addOns;

    /** What the client gets back: the decorated plan, read from its outer layer. */
    public record Quote(String description, Money monthlyFee) {}

    // @step:quoter
    public MembershipQuoter(Membership basic, List<AddOn> addOns) {
        this.basic = basic;
        this.addOns = addOns;              // every AddOn bean, sorted by @Order
    }

    public Membership quote(List<String> requested) {
        List<String> names = normalise(requested);
        Membership plan = basic;
        for (AddOn addOn : addOns) {
            if (names.contains(addOn.name())) {
                plan = addOn.wrap(plan);   // one more layer around the plan
            }
        }
        return plan;
    }
    // @end

    /** Builds the plan and asks the outermost layer; each layer asks the one inside. */
    public Quote price(List<String> requested) {
        Membership plan = quote(requested);
        return new Quote(plan.description(), plan.monthlyFee());
    }

    private List<String> normalise(List<String> requested) {
        var names = new ArrayList<String>();
        var seen = new HashSet<String>();
        for (String raw : requested) {
            String name = raw == null ? "" : raw.strip().toLowerCase(Locale.ROOT);
            if (name.isEmpty()) {
                throw new IllegalArgumentException("empty add-on name");
            }
            if (addOns.stream().noneMatch(a -> a.name().equals(name))) {
                throw new IllegalArgumentException("unknown add-on: " + name);
            }
            if (!seen.add(name)) {
                throw new IllegalArgumentException("repeated add-on: " + name);
            }
            names.add(name);
        }
        return names;
    }
}
