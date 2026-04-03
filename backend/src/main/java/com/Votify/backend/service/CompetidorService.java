package com.Votify.backend.service;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.model.CompetidorMO;
import com.Votify.backend.repository.CompetidorRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class CompetidorService extends GenericService<CompetidorMO> {

    private final CompetidorRepository competidorRepository;

    @Override
    protected JpaRepository<CompetidorMO, UUID> getRepository() {
        return competidorRepository;
    }
}


