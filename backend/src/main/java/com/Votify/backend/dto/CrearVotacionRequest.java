package com.Votify.backend.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.ModalidadVotacionMO;
import com.Votify.backend.model.TipoVotacionMO;


public record CrearVotacionRequest (
    UUID eventoId,
    String nombre,
    TipoVotacionMO tipo,
    ModalidadVotacionMO modalidad,
    int maxSelecciones,
    OffsetDateTime inicio,
    OffsetDateTime fin,
    EstadoVotacionMO estado,
    Boolean comentariosActivos,
    Boolean comentarioObligatorio,
    List<CriterioEvaluacionRequest> criterios,
    Integer pesoPorcentajePopular,
    Integer pesoPorcentajeJurado
) {}