package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.model.VotacionProyecto;
import com.Votify.backend.repository.VotacionProyectoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VotacionProyectoService extends GenericService<VotacionProyecto>{
    
    private final VotacionProyectoRepository votacionProyectoRepository;

    @Override
    protected JpaRepository<VotacionProyecto, UUID> getRepository(){

        return votacionProyectoRepository;

    }

    public List<VotacionProyecto> findByVotacion_Id(UUID votacionId){

        return votacionProyectoRepository.findByVotacion_Id(votacionId);

    }

    public List<VotacionProyecto> findByProyecto_Id(UUID proyectoId){

        return votacionProyectoRepository.findByProyecto_Id(proyectoId);
        
    }
}
