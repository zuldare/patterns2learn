package com.patterns2learn.box.facade.subsystems;

import java.math.BigDecimal;

public record Subscription(long memberId, String plan, BigDecimal monthlyPrice) {}
