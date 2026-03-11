package com.Votify.backend.service;


import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.model.ComentarioMO;
import com.Votify.backend.repository.ComentarioRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class ComentarioService extends GenericService<ComentarioMO>{

    private final ComentarioRepository comentarioRepository;

    @Override
    protected JpaRepository<ComentarioMO, UUID> getRepository(){

        return comentarioRepository;

    }

    public List<ComentarioMO> findByVotacionProyecto(UUID votacionProyectoId){

        return comentarioRepository.findByVotacionProyecto_Id(votacionProyectoId);
        
    }
    
}
