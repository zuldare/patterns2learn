package com.patterns2learn.box.bridge.channels;

import com.patterns2learn.box.bridge.Delivery;
import com.patterns2learn.box.bridge.Member;
import org.springframework.stereotype.Component;

@Component
public class SmsChannel implements Channel {
    static final int LIMIT = 160;   // simplified: real SMS counts GSM-7 septets, or 70 with UCS-2

    @Override public String name() { return "sms"; }

    // @step:sms
    @Override
    public Delivery deliver(Member to, String title, String body) {
        String text = title + ": " + body;
        text = Texts.cut(text, LIMIT);                   // one rule, for every reminder
        return new Delivery(name(), to.phone(), text);
    }
    // @end
}
