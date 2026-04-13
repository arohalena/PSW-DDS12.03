package com.Votify.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "puntuacion_criterio")
public class PuntuacionCriterioMO extends ModeloBaseMO{
    
    @ManyToOne
    @JoinColumn(name = "criterio_id", nullable = false)
    private CriterioEvaluacionMO criterio;

    @ManyToOne
    @JoinColumn(name = "votacion_proyecto_id", nullable = false)
    private VotacionProyectoMO votacionProyecto;

    @Column(name = "anon_token_hash", nullable = false)
    private String anonTokenHash;

    @Column(nullable = false)
    private int puntuacion;
}
