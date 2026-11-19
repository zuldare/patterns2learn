package com.patterns2learn.box.facade.before;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.patterns2learn.box.facade.JoinRequest;
import com.patterns2learn.box.facade.subsystems.AccessCards;
import com.patterns2learn.box.facade.subsystems.Billing;
import com.patterns2learn.box.facade.subsystems.IntroClasses;
import com.patterns2learn.box.facade.subsystems.Mailer;
import com.patterns2learn.box.facade.subsystems.MemberRegistry;
import com.patterns2learn.box.facade.subsystems.PaymentDeclinedException;
import com.patterns2learn.box.facade.subsystems.Waivers;
import org.junit.jupiter.api.Test;

class FrontDeskControllerTest {
    final MemberRegistry registry = new MemberRegistry();
    final AccessCards cards = new AccessCards(10);
    final FrontDeskController desk = new FrontDeskController(registry, cards, new Billing(), new Waivers(), new IntroClasses(), new Mailer());

    @Test void itWorksOnTheHappyPath() {
        assertThat(desk.join(new JoinRequest("Ana", "ana@box.example", "unlimited", "tok_visa")).card()).isEqualTo("CARD-0001");
    }

    @Test void butADeclinedPaymentLeavesAHalfSignedUpMemberBehind() {
        assertThatThrownBy(() -> desk.join(new JoinRequest("Leo", "leo@box.example", "unlimited", "tok_declined")))
            .isInstanceOf(PaymentDeclinedException.class);
        assertThat(registry.findByEmail("leo@box.example")).isPresent();   // registered, never paid
        assertThat(cards.issued()).hasSize(1);                             // and holding a card
    }
}
