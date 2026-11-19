package com.patterns2learn.box.facade.web;

import com.patterns2learn.box.facade.JoinRequest;
import com.patterns2learn.box.facade.OnboardingFacade;
import com.patterns2learn.box.facade.Welcome;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** The tablet at the entrance: a form post, the same facade. */
@RestController
public class KioskController {
    private final OnboardingFacade onboarding;

    public KioskController(OnboardingFacade onboarding) {
        this.onboarding = onboarding;
    }

    @PostMapping("/api/kiosk/join")
    @ResponseStatus(HttpStatus.CREATED)
    public Welcome join(@RequestParam String name, @RequestParam String email,
                        @RequestParam String plan, @RequestParam String paymentToken) {
        return onboarding.join(new JoinRequest(name, email, plan, paymentToken));
    }
}
