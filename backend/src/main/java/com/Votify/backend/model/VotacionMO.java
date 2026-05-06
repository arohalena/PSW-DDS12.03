package com.Votify.backend.model;

import java.time.OffsetDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

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

    @Column(nullable = false)
    private String nombre;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private EstadoVotacionMO estado;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "modo_ranking", nullable = false)
    private ModoRankingMO modoRanking = ModoRankingMO.AUTOMATICO;

    @Column(nullable = false)
    private boolean comentariosActivos;

    @Column(nullable = false)
    private boolean comentarioObligatorio;

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

    //Transiciones de estado

    public void abrir() {
        this.estado = EstadoVotacionMO.ABIERTA;
    }

    public void pausar() {
        if (this.estado == EstadoVotacionMO.CERRADA) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "No se puede pausar una votación cerrada.");
        }
        this.estado = EstadoVotacionMO.PAUSADA;
    }

    public void reanudar() {
        if (this.estado != EstadoVotacionMO.PAUSADA) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Solo se puede reanudar una votación pausada.");
        }
        this.estado = EstadoVotacionMO.ABIERTA;
    }

    public void cerrar() {
        this.estado = EstadoVotacionMO.CERRADA;
    }

    public boolean aplicarTransicionPorFechas() {
        OffsetDateTime ahora = OffsetDateTime.now();

        if (fin != null && ahora.isAfter(fin) && estado != EstadoVotacionMO.CERRADA) {
            this.estado = EstadoVotacionMO.CERRADA;
            return true;
        }

        if (estado == EstadoVotacionMO.PENDIENTE
                && inicio != null
                && !ahora.isBefore(inicio)
                && (fin == null || ahora.isBefore(fin))) {
            this.estado = EstadoVotacionMO.ABIERTA;
            return true;
        }

        return false;
    }
}