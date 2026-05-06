package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.model.VotoCriterioMO;
import com.Votify.backend.repository.VotoCriterioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VotoCriterioService extends GenericService<VotoCriterioMO> {

    private final VotoCriterioRepository votoCriterioRepository;

    @Override
    protected JpaRepository<VotoCriterioMO, UUID> getRepository() {
        return votoCriterioRepository;
    }

    public List<VotoCriterioMO> findByVoto_Id(UUID votoId) {
        return votoCriterioRepository.findByVoto_Id(votoId);
    }
}