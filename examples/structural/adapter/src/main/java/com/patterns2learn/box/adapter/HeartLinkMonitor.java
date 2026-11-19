package com.patterns2learn.box.adapter;

import com.patterns2learn.box.adapter.vendor.heartlink.HeartLinkHub;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Adapter: makes the HeartLink hub look like a HeartRateMonitor. */
public class HeartLinkMonitor implements HeartRateMonitor {
    private static final Pattern SAMPLE = Pattern.compile("HR=(\\d{1,3});T=(\\d{1,12})");
    private final HeartLinkHub hub;
    private final Map<String, Integer> channelByAthlete;

    public HeartLinkMonitor(HeartLinkHub hub, Map<String, Integer> channelByAthlete) {
        this.hub = hub;
        this.channelByAthlete = Map.copyOf(channelByAthlete);
    }

    // @step:heartlink
    @Override
    public Optional<HeartRate> current(String athleteId) {
        Integer channel = channelByAthlete.get(athleteId);
        if (channel == null) return Optional.empty();
        String raw = hub.readSample(channel);                    // "HR=171;T=1700000000"
        if (HeartLinkHub.NO_SIGNAL.equals(raw)) return Optional.empty();
        Matcher m = SAMPLE.matcher(raw);
        if (!m.matches()) throw new MonitorException("unreadable HeartLink sample on channel " + channel);
        int bpm = Integer.parseInt(m.group(1));
        if (!HeartRate.plausible(bpm)) throw new MonitorException("implausible HeartLink reading: " + bpm + " bpm");
        return Optional.of(new HeartRate(bpm, Instant.ofEpochSecond(Long.parseLong(m.group(2)))));
    }
    // @end
}
