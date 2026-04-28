package com.Votify.backend.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.ModalidadVotacionMO;
import com.Votify.backend.model.TipoVotacionMO;


public record CrearVotacionRequest (
    UUID eventoId,
    TipoVotacionMO tipo,
    ModalidadVotacionMO modalidad,
    OffsetDateTime inicio,
    OffsetDateTime fin,
    EstadoVotacionMO estado,
    List<CriterioEvaluacionRequest> criterios
) {}