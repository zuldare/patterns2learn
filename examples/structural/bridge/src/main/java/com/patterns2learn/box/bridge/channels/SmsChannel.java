package com.patterns2learn.box.bridge.channels;

import com.patterns2learn.box.bridge.Delivery;
import com.patterns2learn.box.bridge.Member;
import org.springframework.stereotype.Component;

@Component("sms")
public class SmsChannel implements Channel {
    static final int LIMIT = 160;

    @Override public String name() { return "sms"; }

    // @step:sms
    @Override
    public Delivery deliver(Member to, String title, String body) {
        String text = title + ": " + body;
        if (text.length() > LIMIT) text = text.substring(0, LIMIT - 1) + "…";   // one rule, for every reminder
        return new Delivery(name(), to.phone(), text);
    }
    // @end
}
