package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.TipoCategoriaMO;
import com.Votify.backend.repository.ProyectoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProyectoService extends GenericService<ProyectoMO> {

    private final ProyectoRepository proyectoRepository;

    @Override
    protected JpaRepository<ProyectoMO, UUID> getRepository() {
        return proyectoRepository;
    }

    public List<ProyectoMO> findByEvento_Id(UUID eventoId) {
        return proyectoRepository.findByEvento_Id(eventoId);
    }

    public ProyectoMO obtener(UUID id) {
        return proyectoRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proyecto no encontrado."));
    }

    public boolean equipoOcupadoEnEvento(UUID equipoId, UUID eventoId, UUID proyectoActualId) {
        if (eventoId == null) return false;
        return proyectoActualId == null
            ? proyectoRepository.existsByEvento_IdAndEquipo_Id(eventoId, equipoId)
            : proyectoRepository.existsByEvento_IdAndEquipo_IdAndIdNot(eventoId, equipoId, proyectoActualId);
    }

    public ProyectoMO guardarConDatos(ProyectoMO proyecto, String nombre, String descripcion,
                                       String categoria, EquipoMO equipo, EventoMO evento) {
        proyecto.setNombre(nombre.trim());
        proyecto.setDescripcion(descripcion);
        proyecto.setTipoCategoria(TipoCategoriaMO.valueOf(categoria));
        proyecto.setEquipo(equipo);
        proyecto.setEvento(evento);
        return proyectoRepository.save(proyecto);
    }
}