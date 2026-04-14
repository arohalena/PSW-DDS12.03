package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.CompetidorEventoMO;
import com.Votify.backend.model.CompetidorMO;
import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.repository.CompetidorEventoRepository;
import com.Votify.backend.repository.CompetidorRepository;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.EventoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CompetidorEventoService {

    private final CompetidorEventoRepository competidorEventoRepository;
    private final CompetidorRepository competidorRepository;
    private final EventoRepository eventoRepository;
    private final EquipoRepository equipoRepository;

    public void asignarCompetidorAEquipoEnEvento(UUID competidorId, UUID eventoId, UUID equipoId) {
        if (competidorEventoRepository.existsByCompetidorIdAndEventoId(competidorId, eventoId)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "El competidor ya está asignado a un equipo en este evento."
            );
        }

        CompetidorMO competidor = competidorRepository.findById(competidorId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se ha encontrado el competidor."
            ));

        EventoMO evento = eventoRepository.findById(eventoId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se ha encontrado el evento."
            ));

        EquipoMO equipo = equipoRepository.findById(equipoId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se ha encontrado el equipo."
            ));

        if (equipo.getEvento() == null || !equipo.getEvento().getId().equals(eventoId)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El equipo no pertenece al evento indicado."
            );
        }

        CompetidorEventoMO relacion = new CompetidorEventoMO();
        relacion.setCompetidor(competidor);
        relacion.setEvento(evento);
        relacion.setEquipo(equipo);

        competidorEventoRepository.save(relacion);
    }

    public List<CompetidorEventoMO> getAsignacionesPorEvento(UUID eventoId) {
        return competidorEventoRepository.findByEventoId(eventoId);
    }

    public List<CompetidorEventoMO> getAsignacionesPorEquipo(UUID equipoId) {
        return competidorEventoRepository.findByEquipoId(equipoId);
    }

    public List<CompetidorEventoMO> getAsignacionesPorCompetidor(UUID competidorId) {
        return competidorEventoRepository.findByCompetidorId(competidorId);
    }

    public void eliminarAsignacion(UUID id) {
        if (!competidorEventoRepository.existsById(id)) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se ha encontrado la asignación."
            );
        }

        competidorEventoRepository.deleteById(id);
    }

    public List<CompetidorMO> getCompetidoresPorEquipo(UUID equipoId) {
        List<CompetidorEventoMO> asignaciones = competidorEventoRepository.findByEquipoId(equipoId);
        return asignaciones.stream()
            .map(CompetidorEventoMO::getCompetidor)
            .collect(java.util.stream.Collectors.toList());
    }
}
