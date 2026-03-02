package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.Votify.backend.model.Organizador;
import com.Votify.backend.repository.OrganizadorRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service

public class OrganizadorService {
    
    private final OrganizadorRepository organizadorRepository;

    public List<Organizador> findAll() {

        return organizadorRepository.findAll();

    }

    public Organizador findById(UUID id){

        return organizadorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("No se ha encontrado al organizador"));

    }

    public Organizador save(Organizador organizador){

        return organizadorRepository.save(organizador);

    }

    public void delete(UUID id){

        organizadorRepository.deleteById(id);

    }
}
