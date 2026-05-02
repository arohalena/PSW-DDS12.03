package com.Votify.backend.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.Votify.backend.model.ComentarioMO;
import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.VotacionMO;

public record MiProyectoDashboardResponse(
    UUID usuarioId,
    UUID competidorId,
    List<EquipoMO> equipos,
    List<EventoMO> eventos,
    List<ProyectoMO> proyectos,
    List<ProyectoDashboardItem> proyectosDashboard
) {
    public record ProyectoDashboardItem(
        ProyectoMO proyecto,
        EquipoMO equipo,
        EventoMO evento,
        long totalVotos,
        int totalEvaluaciones,
        int vistas,
        List<ComentarioMO> comentarios,
        List<VotacionDashboardItem> votaciones
    ) {}

    public record VotacionDashboardItem(
        UUID votacionProyectoId,
        VotacionMO votacion,
        long totalVotos,
        Map<String, Object> rankingEntry,
        List<Map<String, Object>> ranking
    ) {}
}