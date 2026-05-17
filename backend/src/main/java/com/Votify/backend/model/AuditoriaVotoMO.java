package com.Votify.backend.model;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@Entity
@Table(name = "auditoria_voto")
public class AuditoriaVotoMO extends ModeloBaseMO {

    @Column(name = "voto_id", nullable = false)
    private UUID votoId;

    @Column(name = "votacion_id", nullable = false)
    private UUID votacionId;

    @Column(name = "proyecto_id", nullable = false)
    private UUID proyectoId;

    @Column(name = "anon_token_hash", nullable = false)
    private String anonTokenHash;

    @Column(nullable = false, length = 16)
    private String accion;

    @Column(name = "ip_hash", length = 128)
    private String ipHash;

    @Column(name = "user_agent_hash", length = 128)
    private String userAgentHash;
    
}