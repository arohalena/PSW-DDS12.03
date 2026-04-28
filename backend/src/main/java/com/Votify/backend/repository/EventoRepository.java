package com.Votify.backend.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.EventoMO;


public interface EventoRepository extends JpaRepository<EventoMO, UUID>{

    boolean existsByCodigoAccesoPublico(String codigoAccesoPublico);
    Optional<EventoMO> findByCodigoAccesoPublico(String codigoAccesoPublico);
    int getNumProyectosPorVotoByEvento(UUID eventoId);
    
}
