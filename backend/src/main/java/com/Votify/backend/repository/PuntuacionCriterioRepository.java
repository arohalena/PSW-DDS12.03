package com.Votify.backend.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.Votify.backend.model.PuntuacionCriterioMO;

public interface PuntuacionCriterioRepository extends JpaRepository<PuntuacionCriterioMO, UUID>{
    
    List<PuntuacionCriterioMO> findByVotacionProyecto_Id(UUID votacionProyectoId);

    Optional<PuntuacionCriterioMO> findByCriterio_IdAndVotacionProyecto_IdAndAnonTokenHash(UUID criterioId, UUID votacionProyectoId, String anonTokenHash);

    @Query("SELECT AVG(p.puntuacion) FROM PuntuacionCriterioMO p WHERE p.criterio.id = :criterioId AND p.votacionProyecto.id = :vpId")
    Double promedioByCriterioAndVotacionProyecto(@Param("criterioId") UUID criterioId, @Param("vpId") UUID vpId);

    List<PuntuacionCriterioMO> findByCriterio_Evento_Id(UUID eventoId);

}
