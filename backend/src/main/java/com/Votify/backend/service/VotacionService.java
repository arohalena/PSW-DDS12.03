package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.model.Votacion;
import com.Votify.backend.repository.VotacionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VotacionService extends GenericService<Votacion>{
    
    private final VotacionRepository votacionRepository;

    @Override
    protected JpaRepository<Votacion, UUID> getRepository(){

        return votacionRepository;
        
    }

    public List<Votacion> findByEvento_Id(UUID eventoId){

        return votacionRepository.findByEvento_Id(eventoId);

    }

}
