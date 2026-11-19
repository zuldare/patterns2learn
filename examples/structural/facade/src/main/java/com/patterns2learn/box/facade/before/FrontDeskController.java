package com.patterns2learn.box.facade.before;

import com.patterns2learn.box.facade.JoinRequest;
import com.patterns2learn.box.facade.Welcome;
import com.patterns2learn.box.facade.subsystems.AccessCards;
import com.patterns2learn.box.facade.subsystems.Billing;
import com.patterns2learn.box.facade.subsystems.IntroClasses;
import com.patterns2learn.box.facade.subsystems.Mailer;
import com.patterns2learn.box.facade.subsystems.Member;
import com.patterns2learn.box.facade.subsystems.MemberRegistry;
import com.patterns2learn.box.facade.subsystems.Subscription;
import com.patterns2learn.box.facade.subsystems.Waivers;

/** Before: the front desk's controller drives all six subsystems itself (not a Spring bean here). */
public class FrontDeskController {
    private final MemberRegistry registry;
    private final AccessCards cards;
    private final Billing billing;
    private final Waivers waivers;
    private final IntroClasses intro;
    private final Mailer mailer;

    public FrontDeskController(MemberRegistry registry, AccessCards cards, Billing billing,
                               Waivers waivers, IntroClasses intro, Mailer mailer) {
        this.registry = registry;
        this.cards = cards;
        this.billing = billing;
        this.waivers = waivers;
        this.intro = intro;
        this.mailer = mailer;
    }

    // @step:front-desk
    public Welcome join(JoinRequest req) {
        Member member = registry.register(req.name(), req.email());
        String card = cards.issue(member.id());
        Subscription sub = billing.subscribe(member.id(), req.plan(), req.paymentToken());
        waivers.send(member);
        String introClass = intro.bookIntro(member.id());
        mailer.welcome(member, card, introClass);
        return new Welcome(member.id(), member.name(), card, sub.plan(), sub.monthlyPrice(), introClass);
    }
    // @end
}
