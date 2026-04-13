package com.Votify.backend.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnore;

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

    @ManyToOne
    @JoinColumn(name = "evento_id", nullable = false)
    private EventoMO evento;
    
    @JsonIgnore
    @OneToMany(mappedBy = "equipo")
    @JsonIgnore
    private List<CompetidorEventoMO> competidores;
}