package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.repository.ProyectoRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotacionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VotacionProyectoService extends GenericService<VotacionProyectoMO>{
    
    private final VotacionProyectoRepository votacionProyectoRepository;
    private final VotacionRepository votacionRepository;
    private final ProyectoRepository proyectoRepository;

    @Override
    protected JpaRepository<VotacionProyectoMO, UUID> getRepository(){

        return votacionProyectoRepository;

    }

    public List<VotacionProyectoMO> findByVotacion_Id(UUID votacionId){

        return votacionProyectoRepository.findByVotacion_Id(votacionId);

    }

    public List<VotacionProyectoMO> findByProyecto_Id(UUID proyectoId){

        return votacionProyectoRepository.findByProyecto_Id(proyectoId);
        
    }

    public VotacionProyectoMO crear(VotacionProyectoMO votacionProyecto){
        if(votacionProyecto.getVotacion() == null || votacionProyecto.getVotacion().getId() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación es requerida");
        }

        if(votacionProyecto.getProyecto() == null || votacionProyecto.getProyecto().getId() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El proyecto es requerido");
        }

        VotacionMO votacion = votacionRepository.findById(votacionProyecto.getVotacion().getId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Votación no encontrada"));
        ProyectoMO proyecto = proyectoRepository.findById(votacionProyecto.getProyecto().getId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proyecto no encontrado"));


        if (!proyecto.getEvento().getId().equals(votacion.getEvento().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"El proyecto no pertenece al mismo evento que la votación.");
        }

        VotacionProyectoMO nuevo = new VotacionProyectoMO();
        nuevo.setVotacion(votacion);
        nuevo.setProyecto(proyecto);
        return votacionProyectoRepository.save(nuevo);

    }
}
