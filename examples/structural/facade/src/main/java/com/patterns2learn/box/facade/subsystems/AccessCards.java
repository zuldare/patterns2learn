package com.patterns2learn.box.facade.subsystems;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Subsystem: the plastic cards that open the door. There are only so many. */
@Component
public class AccessCards {
    private final int stock;
    private final Deque<String> returned = new ArrayDeque<>();
    private final Set<String> issued = new LinkedHashSet<>();
    private int printed;

    public AccessCards(@Value("${box.cards.stock:100}") int stock) {
        this.stock = stock;
    }

    public synchronized String issue(long memberId) {
        String card;
        if (!returned.isEmpty()) {
            card = returned.pop();
        } else if (printed < stock) {
            card = "CARD-%04d".formatted(++printed);
        } else {
            throw new CardsOutOfStockException();
        }
        issued.add(card);
        return card;
    }

    public synchronized void revoke(String card) {
        if (issued.remove(card)) returned.push(card);
    }

    public synchronized List<String> issued() {
        return List.copyOf(issued);
    }
}
