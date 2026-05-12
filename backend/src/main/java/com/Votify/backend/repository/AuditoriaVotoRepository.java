package com.Votify.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.Votify.backend.model.AuditoriaVotoMO;

public interface AuditoriaVotoRepository extends JpaRepository<AuditoriaVotoMO, UUID> {

    List<AuditoriaVotoMO> findByVotacionId(UUID votacionId);

    long countByVotacionId(UUID votacionId);

    @Query("""
        SELECT a.proyectoId AS proyectoId, COUNT(a) AS total
          FROM AuditoriaVotoMO a
         WHERE a.votacionId = :votacionId
         GROUP BY a.proyectoId
    """)
    List<Object[]> contarPorProyecto(UUID votacionId);
}