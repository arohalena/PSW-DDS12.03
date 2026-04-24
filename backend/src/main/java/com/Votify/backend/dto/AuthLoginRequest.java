package com.Votify.backend.dto;

public record AuthLoginRequest (
    String email,
    String password
) {}
