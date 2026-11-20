package com.patterns2learn.box.bridge;

import com.patterns2learn.box.bridge.channels.Channel;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.stereotype.Service;

@Service
public class ReminderService {
    private record Preference(Member member, String channel) {}

    private final Map<String, Channel> channels;
    private final Map<String, Preference> members = Map.of(
        "ana", new Preference(new Member("ana", "Ana", "ana@box.example", "+34600000001", "device-ana"), "email"),
        "leo", new Preference(new Member("leo", "Leo", "leo@box.example", "+34600000002", "device-leo"), "sms"),
        "eva", new Preference(new Member("eva", "Eva", "eva@box.example", "+34600000003", "device-eva"), "push"));

    public ReminderService(List<Channel> all) {
        this.channels = new TreeMap<>();            // every Channel bean, by its own name()
        for (Channel c : all) channels.put(c.name(), c);
    }

    public Delivery remind(String memberId, String kind, String channelName) {
        if (memberId == null || memberId.isBlank()) throw new InvalidReminderException("member is required");
        Preference p = members.get(memberId.strip().toLowerCase(Locale.ROOT));
        if (p == null) throw new UnknownMemberException(abbreviate(memberId));
        boolean asked = channelName != null && !channelName.isBlank();
        Channel channel = channel(asked ? channelName : p.channel());   // theirs, unless overridden
        Reminder reminder = switch (kind == null ? "" : kind.strip().toLowerCase(Locale.ROOT)) {
            case "class" -> new ClassReminder(channel, "Hyrox prep", LocalTime.of(18, 0));
            case "payment" -> new PaymentReminder(channel, new BigDecimal("89.00"), LocalDate.of(2026, 12, 1),
                "Card or cash at the front desk.");
            default -> throw new InvalidReminderException("kind must be class or payment");
        };
        return reminder.send(p.member());
    }

    public List<String> channelNames() {
        return List.copyOf(channels.keySet());
    }

    private Channel channel(String name) {
        Channel c = channels.get(name.strip().toLowerCase(Locale.ROOT));
        if (c == null) throw new InvalidReminderException("unknown channel: " + abbreviate(name));
        return c;
    }

    private static String abbreviate(String s) {
        if (s == null) return "";
        String t = s.strip();
        return t.length() <= 20 ? t : t.substring(0, 20) + "…";
    }
}
