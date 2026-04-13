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
@Table(name = "voto_criterio")
public class VotoCriterioMO extends ModeloBaseMO {

    @ManyToOne
    @JoinColumn(name = "voto_id", nullable = false)
    private VotoMO voto;

    @ManyToOne
    @JoinColumn(name = "criterio_id", nullable = false)
    private CriterioEvaluacionMO criterio;

    @Column(nullable = false)
    private Integer puntuacion;
}