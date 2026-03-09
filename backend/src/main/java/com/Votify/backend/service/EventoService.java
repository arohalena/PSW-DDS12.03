package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.Votify.backend.dto.EventoDTO;

import com.Votify.backend.domain.CodigoAcceso;
import com.Votify.backend.domain.Event;
import com.Votify.backend.model.Evento;
import com.Votify.backend.model.Organizador;

import com.Votify.backend.factory.evento.EventCreator;
import com.Votify.backend.factory.evento.EventFactorySelector;

import com.Votify.backend.factory.codigo.CodigoAccesoCreator;
import com.Votify.backend.factory.codigo.CodigoAccesoFactorySelector;

import com.Votify.backend.repository.EventoRepository;
import com.Votify.backend.repository.OrganizadorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EventoService {

    private final EventoRepository eventoRepository;
    private final OrganizadorRepository organizadorRepository;

    public List<Evento> findAll() {
        return eventoRepository.findAll();
    }

    public Evento findById(UUID id) {
        return eventoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado"));
    }

    public Evento createEvento(EventoDTO dto) {

        Organizador organizador = organizadorRepository.findById(dto.getOrganizadorId())
                .orElseThrow(() -> new RuntimeException("Organizador no encontrado"));

        CodigoAccesoCreator codigoCreator =
                CodigoAccesoFactorySelector.getCreator(dto);

        CodigoAcceso codigo = codigoCreator.crear();

        EventCreator eventCreator =
                EventFactorySelector.getCreator(dto);

        Event product = eventCreator.create(dto);

        Evento entity = new Evento();
        entity.setNombre(product.getNombre());
        entity.setDescripcion(product.getDescripcion());
        entity.setFechaInicio(product.getFechaInicio());
        entity.setFechaFin(product.getFechaFin());
        entity.setTipo(product.tipoEvento());
        entity.setCodigoAcceso(codigo.getValor());
        entity.setOrganizador(organizador);

        return eventoRepository.save(entity);
    }
}