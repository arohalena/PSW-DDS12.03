package com.Votify.backend.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.TipoVotacionMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.repository.EventoRepository;
import com.Votify.backend.repository.VotacionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VotacionService extends GenericService<VotacionMO>{
    
    private final VotacionRepository votacionRepository;
    private final EventoRepository eventoRepository;

    @Override
    protected JpaRepository<VotacionMO, UUID> getRepository(){

        return votacionRepository;
        
    }

    public List<VotacionMO> findByEvento_Id(UUID eventoId){

        return votacionRepository.findByEvento_Id(eventoId);

    }

    public VotacionMO crear(VotacionMO votacion){
        if(votacion.getEvento() == null || votacion.getEvento().getId() == null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El evento es requerido");
        }

        EventoMO evento = eventoRepository.findById(votacion.getEvento().getId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado"));
        
        if(votacion.getTipo()==null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El tipo de votación es requerido");
        }

        if(votacion.getTipo() != TipoVotacionMO.POPULAR){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "POr ahora solo se permite votación popular");
        }
        
        if(votacion.getMaxSelecciones() <= 0){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El número máximo de selecciones debe ser mayor a 0");
        }

        OffsetDateTime inicio = votacion.getInicio();
        OffsetDateTime fin = votacion.getFin();
        
        if(inicio != null && fin != null && inicio.isAfter(fin)){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de fin debe ser posterior a la fecha de inicio");
        }
        
        if(votacion.getEstado() == null){
            votacion.setEstado(EstadoVotacionMO.CERRADA);
        }

        votacion.setEvento(evento);
        return votacionRepository.save(votacion);

    }
}
