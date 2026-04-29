package com.Votify.backend.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
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
    @JoinColumn(name = "proyecto_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "equipo"})
    private ProyectoMO proyecto;

    @Column(nullable = false)
    private String nombre;

    @ManyToOne
    @JoinColumn(name = "evento_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private EventoMO evento;
    
    @JsonIgnore
    @OneToMany(mappedBy = "equipo")
    private List<CompetidorEventoMO> competidores;
}