package com.Votify.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "votacion_proyecto")
public class VotacionProyectoMO extends ModeloBaseMO {

    @ManyToOne
    @JoinColumn(name = "votacion_id", nullable = false)
    private VotacionMO votacion;

    @ManyToOne
    @JoinColumn(name = "proyecto_id", nullable = false)
    private ProyectoMO proyecto;
    
}
