package com.Votify.backend.model;

import java.math.BigDecimal;

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
@Table(name = "criterio_evaluacion")
public class CriterioEvaluacionMO extends ModeloBaseMO {

    @ManyToOne
    @JoinColumn(name = "votacion_id", nullable = false)
    private VotacionMO votacion;

    @Column(nullable = false)
    private String nombre;

    @Column(columnDefinition = "text")
    private String descripcion;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal peso;

    @Column(name = "orden_visual", nullable = false)
    private Integer ordenVisual;
}
