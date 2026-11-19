package com.patterns2learn.box.proxy.before;

import com.patterns2learn.box.proxy.Booking;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.DefaultTransactionDefinition;

/** Before (GoF): a hand-written proxy with the same interface, wrapping the transaction around the real call. */
// @step:hand-proxy
public class TxBookingProxy implements BookingOperations {
    private final BookingOperations target;
    private final PlatformTransactionManager tx;

    public TxBookingProxy(BookingOperations target, PlatformTransactionManager tx) {
        this.target = target;
        this.tx = tx;
    }

    @Override
    public Booking book(long sessionId, String athlete) {
        TransactionStatus status = tx.getTransaction(new DefaultTransactionDefinition());
        try {
            Booking booking = target.book(sessionId, athlete); // delegate to the real subject
            tx.commit(status);
            return booking;
        } catch (RuntimeException e) {
            tx.rollback(status);
            throw e;
        }
    }
}
// @end
