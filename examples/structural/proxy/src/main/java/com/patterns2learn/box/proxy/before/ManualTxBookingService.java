package com.patterns2learn.box.proxy.before;

import com.patterns2learn.box.proxy.Booking;
import com.patterns2learn.box.proxy.BookingRepository;
import com.patterns2learn.box.proxy.ClassFullException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.DefaultTransactionDefinition;

/** Before: every method opens, commits and rolls back its own transaction by hand. */
public class ManualTxBookingService {
    private final BookingRepository repo;
    private final PlatformTransactionManager tx;

    public ManualTxBookingService(BookingRepository repo, PlatformTransactionManager tx) {
        this.repo = repo;
        this.tx = tx;
    }

    // @step:manual-tx
    public Booking book(long sessionId, String athlete) {
        TransactionStatus status = tx.getTransaction(new DefaultTransactionDefinition());
        try {
            repo.insertBooking(sessionId, athlete);
            if (!repo.takeSpot(sessionId)) {
                throw new ClassFullException(sessionId);
            }
            tx.commit(status);
            return new Booking(sessionId, athlete);
        } catch (RuntimeException e) {
            tx.rollback(status);
            throw e;
        }
    }
    // @end

    // @step:manual-repeat
    public void cancel(long sessionId, String athlete) {
        TransactionStatus status = tx.getTransaction(new DefaultTransactionDefinition());
        try {
            repo.deleteBooking(sessionId, athlete);
            repo.releaseSpot(sessionId);
            tx.commit(status);
        } catch (RuntimeException e) {
            tx.rollback(status);
            throw e;
        }
    }
    // @end
}
