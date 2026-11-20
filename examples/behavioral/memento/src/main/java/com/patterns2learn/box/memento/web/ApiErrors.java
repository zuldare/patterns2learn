package com.patterns2learn.box.memento.web;

import com.patterns2learn.box.memento.InvalidDraftException;
import com.patterns2learn.box.memento.NothingToUndoException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(InvalidDraftException.class)
    public ResponseEntity<Map<String, String>> badRequest(InvalidDraftException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(NothingToUndoException.class)
    public ResponseEntity<Map<String, String>> conflict(NothingToUndoException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> unreadable(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(Map.of("error", "malformed request body"));
    }
}
