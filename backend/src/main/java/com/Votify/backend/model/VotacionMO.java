package com.Votify.backend.model;

import java.time.OffsetDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.Votify.backend.state.EstadoVotacion;
import com.Votify.backend.state.EstadoVotacionFactory;
import com.fasterxml.jackson.annotation.JsonIgnore;
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

    @Column(name = "peso_porcentaje_popular")
    private Integer pesoPorcentajePopular;

    @Column(name = "peso_porcentaje_jurado")
    private Integer pesoPorcentajeJurado;

    @Column(nullable = false)
    private boolean comentariosActivos;

    @Column(nullable = false)
    private boolean comentarioObligatorio;

    @Column(name = "resultados_publicados", nullable = false)
    private boolean resultadosPublicados;

    @Column(name = "fecha_publicacion_resultados")
    private OffsetDateTime fechaPublicacionResultados;

    @Transient
    @JsonIgnore
    private EstadoVotacion estadoVotacion;

    @Transient
    @JsonProperty("estadoActual")
    public EstadoVotacionMO getEstadoActual() {
        return estado;
    }

    public void abrir() {
        estadoVotacionActual().abrir(this);
    }

    public void pausar() {
        estadoVotacionActual().pausar(this);
    }

    public void reanudar() {
        estadoVotacionActual().reanudar(this);
    }

     public void cerrar() {
        estadoVotacionActual().cerrar(this);
    }

    public void publicarResultados() {
        estadoVotacionActual().publicarResultados(this);
    }

    public void emitirVoto() {
        estadoVotacionActual().emitirVoto(this);
    }

    public boolean aplicarTransicionPorFechas() {
        return estadoVotacionActual().verificarExpiracion(this);
    }

    public void verificarExpiracion() {
        estadoVotacionActual().verificarExpiracion(this);
    }

    public void cambiarEstado(EstadoVotacionMO nuevoEstado) {
        this.estado = nuevoEstado;
        this.estadoVotacion = EstadoVotacionFactory.desde(nuevoEstado);
    }

    public void setEstado(EstadoVotacionMO estado) {
        cambiarEstado(estado);
    }

    private EstadoVotacion estadoVotacionActual() {
        if (estadoVotacion == null || estadoVotacion.tipo() != estado) {
            estadoVotacion = EstadoVotacionFactory.desde(estado);
        }
        return estadoVotacion;
    }

}