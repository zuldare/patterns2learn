package com.patterns2learn.box.facade;

import com.patterns2learn.box.facade.subsystems.AccessCards;
import com.patterns2learn.box.facade.subsystems.Billing;
import com.patterns2learn.box.facade.subsystems.IntroClasses;
import com.patterns2learn.box.facade.subsystems.Mailer;
import com.patterns2learn.box.facade.subsystems.Member;
import com.patterns2learn.box.facade.subsystems.MemberRegistry;
import com.patterns2learn.box.facade.subsystems.Subscription;
import com.patterns2learn.box.facade.subsystems.Waivers;
import org.springframework.stereotype.Service;

/** The facade: one operation, "join the box", in front of six subsystems. */
@Service
public class OnboardingFacade {
    private final MemberRegistry registry;
    private final AccessCards cards;
    private final Billing billing;
    private final Waivers waivers;
    private final IntroClasses intro;
    private final Mailer mailer;

    public OnboardingFacade(MemberRegistry registry, AccessCards cards, Billing billing,
                            Waivers waivers, IntroClasses intro, Mailer mailer) {
        this.registry = registry;
        this.cards = cards;
        this.billing = billing;
        this.waivers = waivers;
        this.intro = intro;
        this.mailer = mailer;
    }

    // @step:join
    public Welcome join(JoinRequest req) {
        billing.priceOf(req.plan());                       // fail fast on an unknown plan
        Member member = registry.register(req.name(), req.email());
        String card = null;
        Subscription sub;
        try {
            card = cards.issue(member.id());               // reversible steps first…
            sub = billing.subscribe(member.id(), req.plan(), req.paymentToken());   // …charge last
        } catch (RuntimeException e) {
            if (card != null) cards.revoke(card);          // undo what was done
            registry.remove(member.id());
            throw e;
        }
        waivers.send(member);                              // only once it's paid: emails can't be unsent
        String introClass = intro.bookIntro(member.id());
        mailer.welcome(member, card, introClass);
        return new Welcome(member.id(), member.name(), card, sub.plan(), sub.monthlyPrice(), introClass);
    }
    // @end
}
