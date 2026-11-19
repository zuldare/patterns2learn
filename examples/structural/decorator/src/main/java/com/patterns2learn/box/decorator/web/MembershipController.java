package com.patterns2learn.box.decorator.web;

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
        MembershipQuoter.Quote quote = quoter.price(addOns == null ? List.of() : addOns);
        return new QuoteResponse(quote.description(), quote.monthlyFee().toString());
    }

    public record QuoteResponse(String description, String monthlyFee) {}
}
