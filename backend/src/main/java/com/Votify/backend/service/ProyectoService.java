package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.factory.CreadorProyecto;
import com.Votify.backend.factory.CreadorProyectoIA;
import com.Votify.backend.factory.CreadorProyectoSostenibilidad;
import com.Votify.backend.model.Evento;
import com.Votify.backend.model.Proyecto;
import com.Votify.backend.repository.EventoRepository;
import com.Votify.backend.repository.ProyectoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProyectoService extends GenericService<Proyecto> {
    
    private final ProyectoRepository proyectoRepository;
    private final EventoRepository eventoRepository;

    @Override
    protected JpaRepository<Proyecto, UUID> getRepository(){

        return proyectoRepository;

    }

    public List<Proyecto> findByEvento_Id(UUID eventoId){

        return proyectoRepository.findByEvento_Id(eventoId);

    }

    //Método fábrica para proyecto
    public Proyecto crear(Proyecto proyecto){

        if (proyecto.getTipoCategoria() == null) {
            throw new RuntimeException("No se reconoce el tipo de proyecto deseado.");
        }

        CreadorProyecto creador = switch (proyecto.getTipoCategoria().name()) {
            case "IA" -> new CreadorProyectoIA();
            case "SOSTENIBILIDAD" -> new CreadorProyectoSostenibilidad();
            default -> throw new RuntimeException("No se reconoce el tipo de proyecto deseado.");
        };

        com.Votify.backend.domain.Proyecto proyectoDominio =
            creador.create(proyecto.getNombre(), proyecto.getDescripcion());

        Evento evento = eventoRepository.findById(proyecto.getEvento().getId())
            .orElseThrow(() -> new RuntimeException("Evento no encontrado."));

        com.Votify.backend.model.Proyecto entidad =
            new com.Votify.backend.model.Proyecto();

        entidad.setNombre(proyectoDominio.getNombre());
        entidad.setDescripcion(proyectoDominio.getDescripcion());
        entidad.setTipoCategoria(proyectoDominio.categoria());
        entidad.setEvento(evento);

        return proyectoRepository.save(entidad);
        
    }

}
