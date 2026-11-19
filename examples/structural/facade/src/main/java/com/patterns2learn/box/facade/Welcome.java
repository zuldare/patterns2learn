package com.patterns2learn.box.facade;

import java.math.BigDecimal;

/** What the new member gets back. */
public record Welcome(long memberId, String name, String card, String plan, BigDecimal monthlyPrice, String introClass) {}
