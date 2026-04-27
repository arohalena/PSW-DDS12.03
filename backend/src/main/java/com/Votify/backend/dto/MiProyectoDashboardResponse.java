package com.Votify.backend.dto;

import java.util.List;
import java.util.UUID;

import com.Votify.backend.model.ComentarioMO;
import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.ProyectoMO;

public record MiProyectoDashboardResponse (
    UUID usuarioId,
    UUID competidorId,
    ProyectoMO proyecto,
    EquipoMO equipo,
    EventoMO evento,
    long totalVotos,
    List<ComentarioMO> comentarios
) {}
