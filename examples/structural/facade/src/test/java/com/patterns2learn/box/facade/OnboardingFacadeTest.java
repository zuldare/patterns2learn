package com.patterns2learn.box.facade;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.patterns2learn.box.facade.subsystems.AccessCards;
import com.patterns2learn.box.facade.subsystems.Billing;
import com.patterns2learn.box.facade.subsystems.CardsOutOfStockException;
import com.patterns2learn.box.facade.subsystems.DuplicateMemberException;
import com.patterns2learn.box.facade.subsystems.IntroClasses;
import com.patterns2learn.box.facade.subsystems.Mailer;
import com.patterns2learn.box.facade.subsystems.MemberRegistry;
import com.patterns2learn.box.facade.subsystems.PaymentDeclinedException;
import com.patterns2learn.box.facade.subsystems.Waivers;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class OnboardingFacadeTest {
    final MemberRegistry registry = new MemberRegistry();
    final AccessCards cards = new AccessCards(2);
    final Billing billing = new Billing();
    final Waivers waivers = new Waivers();
    final IntroClasses intro = new IntroClasses();
    final Mailer mailer = new Mailer();
    final OnboardingFacade onboarding = new OnboardingFacade(registry, cards, billing, waivers, intro, mailer);

    @Test void oneCallDoesTheWholeSignUp() {
        // @step:join-test
        Welcome ana = onboarding.join(new JoinRequest("Ana", "ana@box.example", "unlimited", "tok_visa"));

        assertThat(ana.card()).isEqualTo("CARD-0001");
        assertThat(ana.monthlyPrice()).isEqualByComparingTo("89.00");
        assertThat(ana.introClass()).isEqualTo("Saturday 10:00");
        // @end
        assertThat(registry.find(ana.memberId())).isPresent();
        assertThat(billing.charges()).containsExactly(new BigDecimal("89.00"));
        assertThat(waivers.sentTo()).containsExactly("ana@box.example");
        assertThat(mailer.outbox()).singleElement().asString().contains("Ana", "CARD-0001", "Saturday 10:00");
    }

    @Test void aDeclinedPaymentUndoesWhatWasAlreadyDoneAndSendsNothing() {
        assertThatThrownBy(() -> onboarding.join(new JoinRequest("Leo", "leo@box.example", "3x-week", "tok_declined")))
            .isInstanceOf(PaymentDeclinedException.class);

        assertThat(registry.findByEmail("leo@box.example")).isEmpty();   // member removed
        assertThat(cards.issued()).isEmpty();                            // card returned
        assertThat(billing.charges()).isEmpty();
        assertThat(waivers.sentTo()).isEmpty();
        assertThat(mailer.outbox()).isEmpty();
        // Leo can try again with another card
        assertThat(onboarding.join(new JoinRequest("Leo", "leo@box.example", "3x-week", "tok_visa")).card()).isEqualTo("CARD-0001");
    }

    @Test void noCardsLeftMeansNoMemberAndNoCharge() {
        onboarding.join(new JoinRequest("Ana", "ana@box.example", "unlimited", "tok_visa"));
        onboarding.join(new JoinRequest("Leo", "leo@box.example", "unlimited", "tok_visa"));
        assertThatThrownBy(() -> onboarding.join(new JoinRequest("Eva", "eva@box.example", "unlimited", "tok_visa")))
            .isInstanceOf(CardsOutOfStockException.class).hasMessage("no access cards left");
        assertThat(registry.findByEmail("eva@box.example")).isEmpty();
        assertThat(billing.charges()).hasSize(2);
    }

    @Test void anUnknownPlanIsRejectedBeforeAnythingSticks() {
        assertThatThrownBy(() -> onboarding.join(new JoinRequest("Eva", "eva@box.example", "gold", "tok_visa")))
            .isInstanceOf(IllegalArgumentException.class).hasMessage("unknown plan: gold");
        assertThat(registry.findByEmail("eva@box.example")).isEmpty();
        assertThat(cards.issued()).isEmpty();
    }

    @Test void theSameEmailCannotJoinTwice() {
        onboarding.join(new JoinRequest("Ana", "ana@box.example", "unlimited", "tok_visa"));
        assertThatThrownBy(() -> onboarding.join(new JoinRequest("Ana B", " ANA@box.example ", "unlimited", "tok_visa")))
            .isInstanceOf(DuplicateMemberException.class).hasMessage("email already registered");
        assertThat(billing.charges()).hasSize(1);
    }
}
