package com.patterns2learn.box.bridge.web;

import com.patterns2learn.box.bridge.InvalidReminderException;
import com.patterns2learn.box.bridge.UnknownMemberException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(UnknownMemberException.class)
    public ResponseEntity<Map<String, String>> notFound(UnknownMemberException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(InvalidReminderException.class)
    public ResponseEntity<Map<String, String>> badRequest(InvalidReminderException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> unreadable(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(Map.of("error", "malformed request body"));
    }
}
