package com.Votify.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.ProyectoMO;

public interface ProyectoRepository extends JpaRepository<ProyectoMO, UUID>{
    
    List<ProyectoMO> findByEvento_Id(UUID eventoId);

}
