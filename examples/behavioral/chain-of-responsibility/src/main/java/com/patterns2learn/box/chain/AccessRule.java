package com.patterns2learn.box.chain;

/** One link of the chain: answer now, or hand the check-in to the rest of the chain (call chain.proceed() at most once). */
public interface AccessRule {
    AccessDecision check(CheckIn checkIn, AccessChain chain);
}
