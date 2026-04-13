package com.Votify.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.VotacionProyectoMO;

public interface VotacionProyectoRepository extends JpaRepository<VotacionProyectoMO, UUID>{
    
    List<VotacionProyectoMO> findByVotacion_Id(UUID votacionId);

    List<VotacionProyectoMO> findByProyecto_Id(UUID proyectoId);
    boolean existsByVotacion_IdAndProyecto_Id(UUID votacionId, UUID proyectoId);
}
