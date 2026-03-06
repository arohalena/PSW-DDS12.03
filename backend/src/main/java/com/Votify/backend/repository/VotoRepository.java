package com.Votify.backend.repository;


import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.Voto;

public interface VotoRepository extends JpaRepository<Voto, UUID>{
    
    List<Voto> findByVotacionProyecto_Id(UUID votacionProyectoId);

}

