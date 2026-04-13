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
@Table(name = "criterio_evaluacion")
public class CriterioEvaluacionMO extends ModeloBaseMO {

    @ManyToOne
    @JoinColumn(name = "evento_id", nullable = false)
    private EventoMO evento;

    @Column(nullable = false)
    private String nombre;

    @Column(columnDefinition = "text")
    private String descripcion;

    @Column(nullable = false)
    private int peso;

    @Column(name = "escala_min", nullable = false)
    private int escalaMin = 1;

    @Column(name = "escala_max", nullable = false)
    private int escalaMax = 10;

    @Column(nullable = false)
    private int orden = 0;
    
}
