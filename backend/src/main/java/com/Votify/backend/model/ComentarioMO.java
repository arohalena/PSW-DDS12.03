package com.Votify.backend.model;

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
@Table(name = "comentario")
public class ComentarioMO extends ModeloBaseMO {

    @Column(name = "anon_token_hash", nullable = false)
    private String anonTokenHash;

    @ManyToOne
    @JoinColumn(name = "votacion_proyecto_id")
    private VotacionProyectoMO votacionProyecto;

    @ManyToOne
    @JoinColumn(name = "proyecto_id")
    private ProyectoMO proyecto;

    @Column(nullable = false)
    private String texto;

}
