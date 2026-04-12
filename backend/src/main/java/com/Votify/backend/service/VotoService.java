package com.Votify.backend.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.model.VotoMO;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotoRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class VotoService extends GenericService<VotoMO>{
    
    private final VotoRepository votoRepository;
    private final VotacionProyectoRepository votacionProyectoRepository;

    @Override
    protected JpaRepository<VotoMO, UUID> getRepository(){

        return votoRepository;

    }

    public List<VotoMO> findByVotacionProyecto_Id(UUID votacionProyectoId){

        return votoRepository.findByVotacionProyecto_Id(votacionProyectoId);
        
    }

    public VotoMO votar(VotoMO voto){
        if(voto.getVotacionProyecto() == null || voto.getVotacionProyecto().getId() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La opción de votación es obligatoria");
        }

        if(voto.getAnonTokenHash() == null || voto.getAnonTokenHash().isBlank()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El token del votante es obligatorio");
        }

        VotacionProyectoMO votacionProyecto = votacionProyectoRepository.findById(voto.getVotacionProyecto().getId())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se ha encontrado la opción de votación"));

        VotacionMO votacion =votacionProyecto.getVotacion();
        if(votacion.getEstado() != EstadoVotacionMO.ABIERTA){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación no está abierta");
        }
        OffsetDateTime ahora = OffsetDateTime.now();
        if(votacion.getInicio() != null && ahora.isBefore(votacion.getInicio())){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación todavía no ha comenzado");
        }
        if(votacion.getFin() != null && ahora.isAfter(votacion.getFin())){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación ya ha finalizado");
        }

        long votosEmitidos = votoRepository.countByVotacionProyecto_Votacion_IdAndAnonTokenHash(votacion.getId(), voto.getAnonTokenHash());

        if(votosEmitidos >= votacion.getMaxSelecciones()){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ya has alcanzado el número máximo de votos permitidos en esta votación");
        }

        if (votoRepository.existsByVotacionProyecto_IdAndAnonTokenHash(
                votacionProyecto.getId(),
                voto.getAnonTokenHash()
        )) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No puedes votar dos veces al mismo proyecto en esta votación.");
        }

        VotoMO nuevo = new VotoMO();
        nuevo.setVotacionProyecto(votacionProyecto);
        nuevo.setAnonTokenHash(voto.getAnonTokenHash());
        return votoRepository.save(nuevo);
    }

}   
