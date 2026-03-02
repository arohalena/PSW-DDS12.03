package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.Votify.backend.model.Evento;
import com.Votify.backend.repository.EventoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EventoService {

    private final EventoRepository eventoRepository;

    public List<Evento> findAll() {

        return eventoRepository.findAll();

    }

    public Evento findById(UUID id){

        return eventoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Evento no se ha encontrado."));


    }

    public Evento save(Evento evento){

        return eventoRepository.save(evento);

    }

    public void delete(UUID id){

        eventoRepository.deleteById(id);
        
    }
    
}
