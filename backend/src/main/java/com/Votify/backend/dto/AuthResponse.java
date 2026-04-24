package com.Votify.backend.dto;

import java.util.UUID;

import com.Votify.backend.model.RolMO;

import lombok.Builder;

@Builder
public record AuthResponse (
    UUID id,
    String nombre,
    String email,
    RolMO rol
) {}
