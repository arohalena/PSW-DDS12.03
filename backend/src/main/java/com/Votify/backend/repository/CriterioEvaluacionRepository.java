package com.Votify.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.CriterioEvaluacionMO;

public interface CriterioEvaluacionRepository extends JpaRepository<CriterioEvaluacionMO, UUID>{
    
    List<CriterioEvaluacionMO> findByEvento_IdOrderByAsc(UUID eventoId);
    
}
