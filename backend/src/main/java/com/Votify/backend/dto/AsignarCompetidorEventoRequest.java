package com.Votify.backend.dto;

import java.util.UUID;

import lombok.Data;

@Data
public class AsignarCompetidorEventoRequest{
    private UUID competidorId;
    private UUID eventoId;
    private UUID equipoId;
}
