package com.patterns2learn.box.facade;

import com.patterns2learn.box.facade.subsystems.AccessCards;
import com.patterns2learn.box.facade.subsystems.Billing;
import com.patterns2learn.box.facade.subsystems.IntroClasses;
import com.patterns2learn.box.facade.subsystems.Mailer;
import com.patterns2learn.box.facade.subsystems.Member;
import com.patterns2learn.box.facade.subsystems.MemberRegistry;
import com.patterns2learn.box.facade.subsystems.Subscription;
import com.patterns2learn.box.facade.subsystems.Waivers;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** The facade: one operation, "join the box", in front of six subsystems. */
@Service
public class OnboardingFacade {
    private static final Logger log = LoggerFactory.getLogger(OnboardingFacade.class);
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
        String card;
        try {
            card = cards.issue(member.id());               // reversible steps first…
        } catch (RuntimeException e) {
            undo(e, () -> registry.remove(member.id()));
            throw e;
        }
        Subscription sub;
        try {
            sub = billing.subscribe(member.id(), req.plan(), req.paymentToken());   // …charge last
        } catch (RuntimeException e) {
            undo(e, () -> cards.revoke(card));             // undo what was done
            undo(e, () -> registry.remove(member.id()));
            throw e;
        }
        // Paid: from here on the member is in. Follow-ups that fail are logged, not undone.
        followUp("waiver", () -> waivers.send(member));
        String introClass = followUp("intro class", () -> intro.bookIntro(member.id()), "to be confirmed");
        followUp("welcome email", () -> mailer.welcome(member, card, introClass));
        return new Welcome(member.id(), member.name(), card, sub.plan(), sub.monthlyPrice(), introClass);
    }
    // @end

    /** Runs one undo step; if it fails too, the original error still wins and carries this one. */
    private static void undo(RuntimeException original, Runnable step) {
        try {
            step.run();
        } catch (RuntimeException e) {
            original.addSuppressed(e);
        }
    }

    private static void followUp(String what, Runnable step) {
        followUp(what, () -> { step.run(); return null; }, null);
    }

    private static <T> T followUp(String what, Supplier<T> step, T fallback) {
        try {
            return step.get();
        } catch (RuntimeException e) {
            log.warn("{} failed after sign-up, retry it by hand: {}", what, e.getMessage());
            return fallback;
        }
    }
}
