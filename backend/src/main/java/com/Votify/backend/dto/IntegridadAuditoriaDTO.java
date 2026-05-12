package com.Votify.backend.dto;

import java.util.UUID;

public record IntegridadAuditoriaDTO(
    UUID votacionId,
    long totalVotosTablaVoto,
    long totalRegistrosAuditoria,
    boolean integridadOk
) {}