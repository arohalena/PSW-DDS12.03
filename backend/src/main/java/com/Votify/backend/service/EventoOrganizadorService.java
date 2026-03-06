package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.model.EventoOrganizador;
import com.Votify.backend.repository.EventoOrganizadorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EventoOrganizadorService extends GenericService<EventoOrganizador>{

    private final EventoOrganizadorRepository eventoOrganizadorRepository;

    @Override
    protected JpaRepository<EventoOrganizador, UUID> getRepository(){

        return eventoOrganizadorRepository;

    }

    public List<EventoOrganizador> findByEvento_Id(UUID eventoId){

        return eventoOrganizadorRepository.findByEvento_Id(eventoId);
        
    }

    public List<EventoOrganizador> findByOrganizador_Id(UUID organizadorId){

        return eventoOrganizadorRepository.findByOrganizador_Id(organizadorId);

    }
}
