package com.Votify.backend.service;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.repository.CompetidorEventoRepository;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.EventoRepository;
import com.Votify.backend.repository.ProyectoRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class EquipoService extends GenericService<EquipoMO> {

    private final EquipoRepository equipoRepository;
    private final EventoRepository eventoRepository;
    private final ProyectoRepository proyectoRepository;
    private final CompetidorEventoRepository competidorEventoRepository;

    @Override
    protected JpaRepository<EquipoMO, UUID> getRepository() {
        return equipoRepository;
    }

    public EquipoMO obtener(UUID id) {
        return equipoRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipo no encontrado."));
    }

    public List<EquipoMO> findAllByIds(Collection<UUID> ids) {
        return equipoRepository.findAllById(ids);
    }

    public EquipoMO findByProyectoId(UUID proyectoId) {
        return equipoRepository.findByProyecto_Id(proyectoId);
    }

    public EquipoMO crear(EquipoMO equipo) {
        if (equipo.getNombre() == null || equipo.getNombre().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del equipo es obligatorio.");
        }

        if (equipo.getEvento() == null || equipo.getEvento().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El evento es obligatorio.");
        }

        if (equipo.getProyecto() == null || equipo.getProyecto().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El proyecto es obligatorio.");
        }

        EventoMO evento = eventoRepository.findById(equipo.getEvento().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se ha encontrado el evento."));

        ProyectoMO proyecto = proyectoRepository.findById(equipo.getProyecto().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se ha encontrado el proyecto."));

        EquipoMO nuevo = new EquipoMO();
        nuevo.setNombre(equipo.getNombre().trim());
        nuevo.setEvento(evento);
        nuevo.setProyecto(proyecto);

        return equipoRepository.save(nuevo);
    }

    public List<EquipoMO> getEquiposPorEvento(UUID eventoId) {
        return equipoRepository.findByEventoId(eventoId);
    }

    @Transactional
    public void desvincularDeEvento(UUID eventoId) {
        for (EquipoMO equipo : equipoRepository.findByEventoId(eventoId)) {
            equipo.setEvento(null);
            equipoRepository.save(equipo);
        }
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        EquipoMO equipo = equipoRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipo no encontrado."));
 
        competidorEventoRepository.deleteAll(
            competidorEventoRepository.findByEquipoId(id)
        );

        ProyectoMO proyecto = equipo.getProyecto();
        if (proyecto != null) {
            proyecto.setEquipo(null);
            proyectoRepository.save(proyecto);
        }
        equipo.setProyecto(null);
        equipoRepository.save(equipo);
        equipoRepository.delete(equipo);
    }
}