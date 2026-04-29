package com.Votify.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.ProyectoMO;

public interface ProyectoRepository extends JpaRepository<ProyectoMO, UUID>{
    
    List<ProyectoMO> findByEvento_Id(UUID eventoId);
    
    List<ProyectoMO> findByEquipo_Id(UUID equipoId);

    boolean existsByEvento_IdAndEquipo_Id(UUID eventoId, UUID equipoId);

    boolean existsByEvento_IdAndEquipo_IdAndIdNot(UUID eventoId, UUID equipoId, UUID proyectoId);

}
