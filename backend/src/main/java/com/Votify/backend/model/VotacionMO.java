package com.Votify.backend.model;

import java.time.OffsetDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.Votify.backend.domain.Evento;

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
@Table(name = "votacion")
public class VotacionMO extends ModeloBaseMO {

    @ManyToOne
    @JoinColumn(name = "evento_id", nullable = false)
    private Evento evento;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private TipoVotacionMO tipo;

    @Column(name = "max_selecciones", nullable = false)
    private int maxSelecciones;

    @Column
    private OffsetDateTime inicio;

    @Column
    private OffsetDateTime fin;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private EstadoVotacionMO estado;
    
}
