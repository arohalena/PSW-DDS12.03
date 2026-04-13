package com.Votify.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.VotoMO;

public interface VotoRepository extends JpaRepository<VotoMO, UUID> {

    List<VotoMO> findByVotacionProyecto_Id(UUID votacionProyectoId);

    long countByVotacionProyecto_Votacion_IdAndAnonTokenHash(UUID votacionId, String anonTokenHash);

    boolean existsByVotacionProyecto_IdAndAnonTokenHash(UUID votacionProyectoId, String anonTokenHash);

    long countByVotacionProyecto_Id(UUID votacionProyectoId);
}

