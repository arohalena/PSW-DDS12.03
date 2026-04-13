package com.Votify.backend.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.ModalidadVotacionMO;
import com.Votify.backend.model.TipoVotacionMO;

import lombok.Data;

@Data
public class CrearVotacionRequest {
    private UUID eventoId;
    private TipoVotacionMO tipo;
    private ModalidadVotacionMO modalidad;
    private int maxSelecciones;
    private OffsetDateTime inicio;
    private OffsetDateTime fin;
    private EstadoVotacionMO estado;
    private List<CriterioEvaluacionRequest> criterios;
}