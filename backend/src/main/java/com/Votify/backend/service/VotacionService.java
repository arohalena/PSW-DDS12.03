package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.repository.VotacionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VotacionService extends GenericService<VotacionMO>{
    
    private final VotacionRepository votacionRepository;

    @Override
    protected JpaRepository<VotacionMO, UUID> getRepository(){

        return votacionRepository;
        
    }

    public List<VotacionMO> findByEvento_Id(UUID eventoId){

        return votacionRepository.findByEvento_Id(eventoId);

    }

}
