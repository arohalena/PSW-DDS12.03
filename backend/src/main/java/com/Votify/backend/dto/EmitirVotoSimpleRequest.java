package com.Votify.backend.dto;

import java.util.UUID;

public record EmitirVotoSimpleRequest (
    UUID votacionProyectoId,
    String anonTokenHash,
    String comentario
) {}