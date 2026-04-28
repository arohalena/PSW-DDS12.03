package com.Votify.backend.repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.CompetidorEventoMO;

public interface CompetidorEventoRepository extends JpaRepository<CompetidorEventoMO, UUID> {

    boolean existsByCompetidorIdAndEventoId(UUID competidorId, UUID eventoId);

    Optional<CompetidorEventoMO> findByCompetidorIdAndEventoId(UUID competidorId, UUID eventoId);

    List<CompetidorEventoMO> findByEventoId(UUID eventoId);

    List<CompetidorEventoMO> findByEquipoId(UUID equipoId);

    List<CompetidorEventoMO> findByCompetidorId(UUID competidorId);
    List<CompetidorEventoMO> findByEvento_Id(UUID eventoId);

    boolean existsByCompetidor_IdAndEquipo_Id(UUID competidorId, UUID equipoId);

    void deleteByEquipo_IdAndCompetidor_Id(UUID equipoId, UUID competidorId);
}
