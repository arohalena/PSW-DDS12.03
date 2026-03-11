package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.model.Voto;
import com.Votify.backend.repository.VotoRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class VotoService extends GenericService<Voto>{
    
    private final VotoRepository votoRepository;

    @Override
    protected JpaRepository<Voto, UUID> getRepository(){

        return votoRepository;

    }

    public List<Voto> findByVotacionProyecto_Id(UUID votacionProyectoId){

        return votoRepository.findByVotacionProyecto_Id(votacionProyectoId);
        
    }
}
