package com.patterns2learn.box.facade.web;

import com.patterns2learn.box.facade.subsystems.CardsOutOfStockException;
import com.patterns2learn.box.facade.subsystems.DuplicateMemberException;
import com.patterns2learn.box.facade.subsystems.PaymentDeclinedException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException e) {
        return error(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler({DuplicateMemberException.class, CardsOutOfStockException.class})
    public ResponseEntity<Map<String, String>> conflict(RuntimeException e) {
        return error(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(PaymentDeclinedException.class)
    public ResponseEntity<Map<String, String>> declined(PaymentDeclinedException e) {
        return error(HttpStatus.PAYMENT_REQUIRED, e.getMessage());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, String>> missing(MissingServletRequestParameterException e) {
        return error(HttpStatus.BAD_REQUEST, "missing parameter " + e.getParameterName());
    }

    /** A body that isn't JSON at all. A JoinRequest that breaks its own rules surfaces with its reason. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> unreadable(HttpMessageNotReadableException e) {
        Throwable cause = e;
        while (cause.getCause() != null && !(cause instanceof IllegalArgumentException)) cause = cause.getCause();
        String reason = cause instanceof IllegalArgumentException ? cause.getMessage() : "malformed request body";
        return error(HttpStatus.BAD_REQUEST, reason);
    }

    private static ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("error", message));
    }
}
