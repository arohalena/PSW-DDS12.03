package com.Votify.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.MaterialMO;

public interface MaterialRespository extends JpaRepository<MaterialMO, UUID>{

    List<MaterialMO> findByProyecto_Id(UUID proyectoId);
    
}
