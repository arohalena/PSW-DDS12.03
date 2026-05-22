package com.Votify.backend.dto;

import java.util.UUID;

public record VotoRequest(
    UUID usuarioId,
    UUID votacionId,
    UUID votacionProyectoId,
    String anonTokenHash,
    String comentario
) {}
