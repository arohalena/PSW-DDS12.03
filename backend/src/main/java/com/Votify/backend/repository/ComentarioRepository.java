package com.Votify.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.ComentarioMO;

public interface ComentarioRepository extends JpaRepository<ComentarioMO, UUID>{

    List<ComentarioMO> findByVotacionProyecto_Id(UUID votacionProyectoId);
    
}
