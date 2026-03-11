package com.Votify.backend.service;

import java.util.UUID;
import java.time.OffsetDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.factory.CreadorEvento;
import com.Votify.backend.factory.CreadorFeriaInovacion;
import com.Votify.backend.factory.CreadorHackathonEvento;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.domain.Evento;
import com.Votify.backend.repository.EventoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EventoService extends GenericService<EventoMO> {
    
    private final EventoRepository eventoRepository;

    @Override
    protected JpaRepository<EventoMO, UUID> getRepository(){

        return eventoRepository;

    }

    //Método para la creación de la factoría de evento
<<<<<<< HEAD
    public EventoMO crear(String tipo, String nombre, String codigoAccesoPublico) {
=======
    public com.Votify.backend.model.Evento crear(String tipo, String nombre, String descripcion, String codigoAccesoPublico, OffsetDateTime fecha_inicio, OffsetDateTime fecha_fin) {
>>>>>>> traerCambios

        if (tipo == null) {
            throw new RuntimeException("No se reconoce el tipo de evento deseado.");
        }

        CreadorEvento creador = switch (tipo) {
            case "HACKATHON" -> new CreadorHackathonEvento();
            case "FERIA_INOVACION" -> new CreadorFeriaInovacion();
            default -> throw new RuntimeException("No se reconoce el tipo de evento deseado.");
        };

<<<<<<< HEAD
        Evento eventoDominio = creador.create(nombre, codigoAccesoPublico);
=======
        com.Votify.backend.domain.Evento eventoDominio = creador.create(nombre, descripcion, codigoAccesoPublico, fecha_inicio, fecha_fin);
>>>>>>> traerCambios

        EventoMO entidad = new EventoMO();
        entidad.setNombre(eventoDominio.getNombre());
        entidad.setCodigoAccesoPublico(eventoDominio.getCodigoAccesoPublico());
        entidad.setDescripcion(eventoDominio.getDescripcion());
        entidad.setTipoEvento(eventoDominio.tipo());
        entidad.setFecha_inicio(eventoDominio.getFechaInicio());
        entidad.setFecha_fin(eventoDominio.getFechaFin());

        return eventoRepository.save(entidad);
    }
}
