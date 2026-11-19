package com.patterns2learn.box.state.web;

import com.patterns2learn.box.state.ConcurrentChangeException;
import com.patterns2learn.box.state.MembershipRuleException;
import com.patterns2learn.box.state.UnknownActionException;
import com.patterns2learn.box.state.UnknownMembershipException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler({MembershipRuleException.class, ConcurrentChangeException.class})
    public ResponseEntity<Map<String, String>> conflict(RuntimeException e) {
        return error(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(UnknownMembershipException.class)
    public ResponseEntity<Map<String, String>> notFound(UnknownMembershipException e) {
        return error(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(UnknownActionException.class)
    public ResponseEntity<Map<String, String>> badAction(UnknownActionException e) {
        return error(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> typeMismatch(MethodArgumentTypeMismatchException e) {
        return error(HttpStatus.BAD_REQUEST, "invalid value for " + e.getName());
    }

    private static ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("error", message));
    }
}
