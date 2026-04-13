package com.Votify.backend.dto;

import java.util.List;
import java.util.UUID;

import com.Votify.backend.model.ComentarioMO;
import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.ProyectoMO;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MiProyectoDashboardResponse {
    private UUID usuarioId;
    private UUID competidorId;
    private ProyectoMO proyecto;
    private EquipoMO equipo;
    private EventoMO evento;
    private long totalVotos;
    private List<ComentarioMO> comentarios;
}
