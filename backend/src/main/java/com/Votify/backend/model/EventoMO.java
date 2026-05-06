package com.Votify.backend.model;

import java.time.OffsetDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.Votify.backend.domain.Evento;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "evento")
public class EventoMO extends ModeloBaseMO {

    @Column(nullable = false)
    private String nombre;

    @Column(name= "codigo_acceso_publico", nullable = true, unique = true)
    private String codigoAccesoPublico;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private TipoEventoMO tipoEvento;

    @Column(nullable = false)
    private OffsetDateTime fecha_fin;

    @Column(nullable = false)
    private OffsetDateTime fecha_inicio;

    @Column(nullable = false)
    private String descripcion;

    @Column(name = "auto_votacion", nullable = false)
    private boolean autoVotacion = false;

    //Refactor del método para EventoService que son setters de la entidad
    //por lo que se mueve aquí
    public static EventoMO desdeDominio(Evento dominio) {

        EventoMO mo = new EventoMO();
        mo.setNombre(dominio.getNombre());
        mo.setCodigoAccesoPublico(dominio.getCodigoAccesoPublico());
        mo.setDescripcion(dominio.getDescripcion());
        mo.setTipoEvento(dominio.tipo());
        mo.setFecha_inicio(dominio.getFechaInicio());
        mo.setFecha_fin(dominio.getFechaFin());
        mo.setAutoVotacion(dominio.isAutoVotacion());
        return mo;

    }

}
