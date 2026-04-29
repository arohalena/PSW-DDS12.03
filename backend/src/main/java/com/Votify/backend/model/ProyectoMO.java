package com.Votify.backend.model;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

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
@Table(name = "proyecto")
public class ProyectoMO extends ModeloBaseMO {

    @ManyToOne
    @JoinColumn(name = "evento_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private EventoMO evento;

    @ManyToOne
    @JoinColumn(name = "equipo_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "competidores"})
    private EquipoMO equipo;

    @Column(nullable = false)
    private String nombre;

    @Column
    private String descripcion;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "tipo_proyecto", nullable = false)
    private TipoCategoriaMO tipoCategoria;
    
}
