package com.Votify.backend.dto;

import java.util.UUID;

public record AsignarCompetidorEventoRequest(
    UUID competidorId,
    UUID eventoId,
    UUID equipoId
) {}
