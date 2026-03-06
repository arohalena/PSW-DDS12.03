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
@Table(name = "voto")
public class Voto extends ModeloBase {

    @ManyToOne
    @JoinColumn(name = "votacion_proyecto_id", nullable = false)
    private VotacionProyecto votacionProyecto;

    @Column(name = "anon_token_hash", nullable = false)
    private String anonTokenHash;

}
