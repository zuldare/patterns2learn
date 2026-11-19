package com.patterns2learn.box.decorator.web;

import com.patterns2learn.box.decorator.Membership;
import com.patterns2learn.box.decorator.MembershipQuoter;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MembershipController {
    private final MembershipQuoter quoter;

    public MembershipController(MembershipQuoter quoter) {
        this.quoter = quoter;
    }

    @GetMapping("/api/memberships/quote")
    public QuoteResponse quote(@RequestParam(required = false) List<String> addOns) {
        Membership plan = quoter.quote(addOns == null ? List.of() : addOns);
        return new QuoteResponse(plan.description(), plan.monthlyFee().toString());
    }

    public record QuoteResponse(String description, String monthlyFee) {}
}
