package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.factory.CreadorProyecto;
import com.Votify.backend.factory.CreadorProyectoIA;
import com.Votify.backend.factory.CreadorProyectoSostenibilidad;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.repository.EventoRepository;
import com.Votify.backend.repository.ProyectoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProyectoService extends GenericService<ProyectoMO> {
    
    private final ProyectoRepository proyectoRepository;
    private final EventoRepository eventoRepository;

    @Override
    protected JpaRepository<ProyectoMO, UUID> getRepository(){

        return proyectoRepository;

    }

    public List<ProyectoMO> findByEvento_Id(UUID eventoId){

        return proyectoRepository.findByEvento_Id(eventoId);

    }

    //Método fábrica para proyecto
    public ProyectoMO crear(ProyectoMO proyecto){

        if (proyecto.getTipoCategoria() == null) {
            throw new RuntimeException("No se reconoce el tipo de proyecto deseado.");
        }

        CreadorProyecto creador = switch (proyecto.getTipoCategoria().name()) {
            case "IA" -> new CreadorProyectoIA();
            case "SOSTENIBILIDAD" -> new CreadorProyectoSostenibilidad();
            default -> throw new RuntimeException("No se reconoce el tipo de proyecto deseado.");
        };

        com.Votify.backend.domain.ProyectoMO proyectoDominio =
            creador.create(proyecto.getNombre(), proyecto.getDescripcion());

        EventoMO evento = eventoRepository.findById(proyecto.getEvento().getId())
            .orElseThrow(() -> new RuntimeException("EventoMO no encontrado."));

        com.Votify.backend.model.ProyectoMO entidad =
            new com.Votify.backend.model.ProyectoMO();

        entidad.setNombre(proyectoDominio.getNombre());
        entidad.setDescripcion(proyectoDominio.getDescripcion());
        entidad.setTipoCategoria(proyectoDominio.categoria());
        entidad.setEvento(evento);

        return proyectoRepository.save(entidad);
        
    }

}
