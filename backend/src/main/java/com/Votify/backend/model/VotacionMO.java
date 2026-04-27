package com.Votify.backend.model;

import java.time.OffsetDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "votacion")
public class VotacionMO extends ModeloBaseMO {

    @ManyToOne
    @JoinColumn(name = "evento_id", nullable = false)
    private EventoMO evento;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private TipoVotacionMO tipo;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private ModalidadVotacionMO modalidad;

    @Column(name = "max_selecciones", nullable = false)
    private int maxSelecciones;

    @Column
    private OffsetDateTime inicio;

    @Column
    private OffsetDateTime fin;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private EstadoVotacionMO estado;

    @Transient
    @JsonProperty("estadoActual")
    public EstadoVotacionMO getEstadoActual() {

        if (estado == EstadoVotacionMO.CERRADA) {
            return EstadoVotacionMO.CERRADA;
        }
        if (estado == EstadoVotacionMO.PAUSADA) {
            return EstadoVotacionMO.PAUSADA;
        }

        OffsetDateTime ahora = OffsetDateTime.now();

        if (fin != null && ahora.isAfter(fin)) {
            return EstadoVotacionMO.CERRADA;
        }

        if (estado == EstadoVotacionMO.ABIERTA) {
            return EstadoVotacionMO.ABIERTA;
        }

        if (inicio != null && ahora.isBefore(inicio)) {
            return EstadoVotacionMO.PENDIENTE;
        }

        return EstadoVotacionMO.ABIERTA;
    }
    
}
