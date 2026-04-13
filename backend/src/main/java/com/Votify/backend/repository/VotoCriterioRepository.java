package com.Votify.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.VotoCriterioMO;

public interface VotoCriterioRepository extends JpaRepository<VotoCriterioMO, UUID> {
    List<VotoCriterioMO> findByVoto_Id(UUID votoId);
}