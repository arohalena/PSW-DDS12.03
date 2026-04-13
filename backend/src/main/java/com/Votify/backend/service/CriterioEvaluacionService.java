package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.model.CriterioEvaluacionMO;
import com.Votify.backend.repository.CriterioEvaluacionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CriterioEvaluacionService extends GenericService<CriterioEvaluacionMO> {

    private final CriterioEvaluacionRepository criterioEvaluacionRepository;

    @Override
    protected JpaRepository<CriterioEvaluacionMO, UUID> getRepository() {
        return criterioEvaluacionRepository;
    }

    public List<CriterioEvaluacionMO> findByVotacionId(UUID votacionId) {
        return criterioEvaluacionRepository.findByVotacion_IdOrderByOrdenVisualAsc(votacionId);
    }
}
