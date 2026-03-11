package com.Votify.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.EventoOrganizadorMO;

public interface EventoOrganizadorRepository extends JpaRepository<EventoOrganizadorMO, UUID>{
    
    List<EventoOrganizadorMO> findByEvento_Id(UUID eventoId);

    List<EventoOrganizadorMO> findByOrganizador_Id(UUID organizadorId);
    
}
