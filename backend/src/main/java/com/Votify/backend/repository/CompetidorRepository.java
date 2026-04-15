package com.Votify.backend.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.CompetidorMO;

public interface CompetidorRepository extends JpaRepository<CompetidorMO, UUID> {

    Optional<CompetidorMO> findByEmailIgnoreCase(String email);
    Optional<CompetidorMO> findByEmail(String email);
    Optional<CompetidorMO> findByUsuarioId(UUID usuarioId);
    
}
