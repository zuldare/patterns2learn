package com.patterns2learn.box.facade.subsystems;

import org.springframework.stereotype.Component;

/** Subsystem: every new member gets a free intro class (always Saturday at 10 in this example). */
@Component
public class IntroClasses {
    public String bookIntro(long memberId) {
        return "Saturday 10:00";
    }
}
