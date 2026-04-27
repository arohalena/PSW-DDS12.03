package com.Votify.backend.dto;

import java.util.UUID;

public record EmitirVotoPuntosRequest(
    UUID votacionProyectoId,
    String anonTokenHash,
    UUID usuarioId,
    Integer puntuacion,
    String comentario
) {
}
