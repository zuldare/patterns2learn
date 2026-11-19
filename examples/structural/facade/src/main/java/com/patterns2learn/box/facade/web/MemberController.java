package com.patterns2learn.box.facade.web;

import com.patterns2learn.box.facade.JoinRequest;
import com.patterns2learn.box.facade.OnboardingFacade;
import com.patterns2learn.box.facade.Welcome;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Front desk app: JSON in, one call to the facade. */
@RestController
public class MemberController {
    private final OnboardingFacade onboarding;

    public MemberController(OnboardingFacade onboarding) {
        this.onboarding = onboarding;
    }

    // @step:clients
    @PostMapping("/api/members")
    @ResponseStatus(HttpStatus.CREATED)
    public Welcome join(@RequestBody JoinRequest request) {
        return onboarding.join(request);
    }
    // @end
}
