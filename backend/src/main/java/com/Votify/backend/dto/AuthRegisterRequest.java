package com.Votify.backend.dto;

public record AuthRegisterRequest (
    String nombre,
    String email,
    String password
) {}
