package com.patterns2learn.box.mediator.web;

import com.patterns2learn.box.mediator.FloorRuleException;
import com.patterns2learn.box.mediator.InvalidFinishException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(FloorRuleException.class)
    public ResponseEntity<Map<String, String>> conflict(FloorRuleException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(InvalidFinishException.class)
    public ResponseEntity<Map<String, String>> badRequest(InvalidFinishException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> unreadable(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(Map.of("error", "malformed request body"));
    }
}
