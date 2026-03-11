package com.Votify.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.Votacion;

public interface VotacionRepository extends JpaRepository<Votacion, UUID>{

    List<Votacion> findByEvento_Id(UUID eventoId);
    
}
