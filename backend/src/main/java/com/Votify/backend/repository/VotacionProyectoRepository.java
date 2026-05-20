package com.Votify.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.Votify.backend.model.VotacionProyectoMO;

public interface VotacionProyectoRepository extends JpaRepository<VotacionProyectoMO, UUID>{
    
    List<VotacionProyectoMO> findByVotacion_Id(UUID votacionId);

    List<VotacionProyectoMO> findByProyecto_Id(UUID proyectoId);

    boolean existsByVotacion_IdAndProyecto_Id(UUID votacionId, UUID proyectoId);

    @Query("""
        SELECT vp FROM VotacionProyectoMO vp
        JOIN FETCH vp.votacion
        WHERE vp.proyecto.id IN :proyectoIds
    """)
    List<VotacionProyectoMO> findRelacionesByProyectoIds(@Param("proyectoIds") List<UUID> ids);
    
}