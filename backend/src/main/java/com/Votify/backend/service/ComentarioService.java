package com.Votify.backend.service;


import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.model.Comentario;
import com.Votify.backend.repository.ComentarioRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class ComentarioService extends GenericService<Comentario>{

    private final ComentarioRepository comentarioRepository;

    @Override
    protected JpaRepository<Comentario, UUID> getRepository(){

        return comentarioRepository;

    }

    public List<Comentario> findByVotacionProyecto(UUID votacionProyectoId){

        return comentarioRepository.findByVotacionProyecto_Id(votacionProyectoId);
        
    }
    
}
