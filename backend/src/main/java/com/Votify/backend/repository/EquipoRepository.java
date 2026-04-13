package com.Votify.backend.repository;

import java.util.UUID;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.EquipoMO;

public interface EquipoRepository extends JpaRepository<EquipoMO, UUID> {
    List<EquipoMO> findByEventoId(UUID eventoId);
}
