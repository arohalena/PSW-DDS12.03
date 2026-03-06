package com.Votify.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.VotacionProyecto;

public interface VotacionProyectoRepository extends JpaRepository<VotacionProyecto, UUID>{
    
    List<VotacionProyecto> findByVotacion_Id(UUID votacionId);

    List<VotacionProyecto> findByProyecto_Id(UUID proyectoId);
    
}
