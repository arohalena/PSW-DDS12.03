package com.Votify.backend.service;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.factory.CreadorEvento;
import com.Votify.backend.factory.CreadorFeriaInovacion;
import com.Votify.backend.factory.CreadorHackathonEvento;
import com.Votify.backend.model.Evento;
import com.Votify.backend.repository.EventoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EventoService extends GenericService<Evento> {
    
    private final EventoRepository eventoRepository;

    @Override
    protected JpaRepository<Evento, UUID> getRepository(){

        return eventoRepository;

    }

    //Método para la creación de la factoría de evento
    public com.Votify.backend.model.Evento crear(String tipo, String nombre, String descripcion, String codigoAccesoPublico) {

        if (tipo == null) {
            throw new RuntimeException("No se reconoce el tipo de evento deseado.");
        }

        CreadorEvento creador = switch (tipo) {
            case "HACKATHON" -> new CreadorHackathonEvento();
            case "FERIA_INOVACION" -> new CreadorFeriaInovacion();
            default -> throw new RuntimeException("No se reconoce el tipo de evento deseado.");
        };

        com.Votify.backend.domain.Evento eventoDominio = creador.create(nombre, descripcion, codigoAccesoPublico);

        com.Votify.backend.model.Evento entidad = new com.Votify.backend.model.Evento();
        entidad.setNombre(eventoDominio.getNombre());
        entidad.setCodigoAccesoPublico(eventoDominio.getCodigoAccesoPublico());
        entidad.setDescripcion(eventoDominio.getDescripcion());
        entidad.setTipoEvento(eventoDominio.tipo());

        return eventoRepository.save(entidad);
    }
}
