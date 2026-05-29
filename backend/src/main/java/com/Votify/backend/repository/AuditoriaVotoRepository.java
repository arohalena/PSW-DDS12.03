package com.Votify.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.Votify.backend.model.AuditoriaVotoMO;

public interface AuditoriaVotoRepository extends JpaRepository<AuditoriaVotoMO, UUID> {

    List<AuditoriaVotoMO> findByVotacionId(UUID votacionId);

    long countByVotacionId(UUID votacionId);

    boolean existsByVotoId(UUID votoId);

    @Query("""
        SELECT COUNT(DISTINCT a.votoId)
          FROM AuditoriaVotoMO a
         WHERE a.votacionId = :votacionId
    """)
    long countDistinctVotosAuditadosByVotacionId(@Param("votacionId") UUID votacionId);

    @Query("""
        SELECT a.proyectoId AS proyectoId, COUNT(DISTINCT a.votoId) AS total
          FROM AuditoriaVotoMO a
         WHERE a.votacionId = :votacionId
         GROUP BY a.proyectoId
    """)
    List<Object[]> contarPorProyecto(UUID votacionId);

    @Query(value = """
        SELECT *
          FROM (
            SELECT DISTINCT ON (a.voto_id)
                a.id              AS id,
                a.voto_id         AS voto_id,
                a.created_at      AS timestamp,
                a.anon_token_hash AS anon_token_hash,
                a.proyecto_id     AS proyecto_id,
                p.nombre          AS proyecto_nombre,
                v.usuario_id      AS votante_id,
                u.nombre          AS votante_nombre
            FROM auditoria_voto a
            JOIN voto v       ON v.id  = a.voto_id
            LEFT JOIN usuario u ON u.id = v.usuario_id
            JOIN proyecto p   ON p.id  = a.proyecto_id
            JOIN votacion vt  ON vt.id = a.votacion_id
            WHERE vt.evento_id = :eventoId
              AND (:votacionId IS NULL OR a.votacion_id = :votacionId)
            ORDER BY a.voto_id, a.created_at DESC
          ) registros_unicos
         ORDER BY timestamp DESC
    """, nativeQuery = true)
    List<Object[]> findEnriquecidosByEvento(
        @Param("eventoId") UUID eventoId,
        @Param("votacionId") UUID votacionId
    );
}
