package com.Votify.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "equipo")
public class EquipoMO extends ModeloBaseMO {

    @OneToOne
    @JoinColumn(name = "proyecto_id", nullable = false)
    private ProyectoMO proyecto;

    @Column(nullable = false)
    private String nombre;

}