package com.Votify.backend.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record RegistroAuditoriaDTO(
    UUID id,
    UUID votoId,
    OffsetDateTime timestamp,
    String anonTokenHash,
    UUID proyectoId,
    String proyectoNombre,
    UUID votanteId,
    String votanteNombre,
    boolean anonimo
) {}