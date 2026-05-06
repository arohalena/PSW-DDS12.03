package com.Votify.backend.model;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor  // requerido por JPA
@Entity
@Table(name = "voto")
public class VotoMO extends ModeloBaseMO {

    @ManyToOne
    @JoinColumn(name = "votacion_proyecto_id", nullable = false)
    private VotacionProyectoMO votacionProyecto;

    @Column(name = "anon_token_hash", nullable = false)
    private String anonTokenHash;

    @Column(name = "puntuacion_total", precision = 6, scale = 2)
    private BigDecimal puntuacionTotal;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private UsuarioMO usuario;

    //Constructor de un voto listo
    public VotoMO(VotacionProyectoMO votacionProyecto, String anonTokenHash,
                  UsuarioMO usuario, BigDecimal puntuacionTotal) {
        this.votacionProyecto = votacionProyecto;
        this.anonTokenHash = anonTokenHash;
        this.usuario = usuario;
        this.puntuacionTotal = puntuacionTotal;
    }
}