package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.model.EventoOrganizadorMO;
import com.Votify.backend.repository.EventoOrganizadorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EventoOrganizadorService extends GenericService<EventoOrganizadorMO>{

    private final EventoOrganizadorRepository eventoOrganizadorRepository;

    @Override
    protected JpaRepository<EventoOrganizadorMO, UUID> getRepository(){

        return eventoOrganizadorRepository;

    }

    public List<EventoOrganizadorMO> findByEvento_Id(UUID eventoId){

        return eventoOrganizadorRepository.findByEvento_Id(eventoId);
        
    }

    public List<EventoOrganizadorMO> findByOrganizador_Id(UUID organizadorId){

        return eventoOrganizadorRepository.findByOrganizador_Id(organizadorId);

    }

    public void eliminarTodasDeEvento(UUID eventoId) {
        eventoOrganizadorRepository.deleteAll(
            eventoOrganizadorRepository.findByEvento_Id(eventoId)
        );
    }
}
