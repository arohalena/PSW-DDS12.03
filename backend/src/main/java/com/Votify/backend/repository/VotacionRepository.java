package com.Votify.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.VotacionMO;

public interface VotacionRepository extends JpaRepository<VotacionMO, UUID>{

    List<VotacionMO> findByEvento_Id(UUID eventoId);
    
}
