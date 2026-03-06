package com.Votify.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.EventoOrganizador;

public interface EventoOrganizadorRepository extends JpaRepository<EventoOrganizador, UUID>{
    
    List<EventoOrganizador> findByEvento_Id(UUID eventoId);

    List<EventoOrganizador> findByOrganizador_Id(UUID organizadorId);
    
}
