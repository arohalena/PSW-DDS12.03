package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.repository.ProyectoRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotacionRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VotacionProyectoService extends GenericService<VotacionProyectoMO> {

    private final VotacionProyectoRepository votacionProyectoRepository;
    private final VotacionRepository votacionRepository;
    private final ProyectoRepository proyectoRepository;

    @Override
    protected JpaRepository<VotacionProyectoMO, UUID> getRepository() {
        return votacionProyectoRepository;
    }

    public List<VotacionProyectoMO> findByVotacion_Id(UUID votacionId) {
        return votacionProyectoRepository.findByVotacion_Id(votacionId);
    }

    public List<VotacionProyectoMO> findByProyecto_Id(UUID proyectoId) {
        return votacionProyectoRepository.findByProyecto_Id(proyectoId);
    }

    public boolean existsByVotacionAndProyecto(UUID votacionId, UUID proyectoId) {
        return votacionProyectoRepository.existsByVotacion_IdAndProyecto_Id(votacionId, proyectoId);
    }

    public VotacionProyectoMO crear(VotacionProyectoMO votacionProyecto) {
        if (votacionProyecto.getVotacion() == null || votacionProyecto.getVotacion().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación es requerida");
        }

        if (votacionProyecto.getProyecto() == null || votacionProyecto.getProyecto().getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El proyecto es requerido");
        }

        VotacionMO votacion = votacionRepository.findById(votacionProyecto.getVotacion().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Votación no encontrada"));

        ProyectoMO proyecto = proyectoRepository.findById(votacionProyecto.getProyecto().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proyecto no encontrado"));

        if (proyecto.getEvento() == null) {
            proyecto.setEvento(votacion.getEvento());
            proyectoRepository.save(proyecto);
        }

        if (!proyecto.getEvento().getId().equals(votacion.getEvento().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "El proyecto no pertenece al mismo evento que la votación.");
        }

        if (votacionProyectoRepository.existsByVotacion_IdAndProyecto_Id(votacion.getId(), proyecto.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "El proyecto ya está asignado a esta votación.");
        }

        VotacionProyectoMO nuevo = new VotacionProyectoMO();
        nuevo.setVotacion(votacion);
        nuevo.setProyecto(proyecto);

        return votacionProyectoRepository.save(nuevo);
    }

    @Transactional
    public void desvincularDeProyecto(UUID proyectoId) {
        votacionProyectoRepository.findByProyecto_Id(proyectoId)
            .forEach(votacionProyectoRepository::delete);
    }

    @Transactional
    public void asignarProyectoAVotaciones(ProyectoMO proyecto, List<UUID> votacionIds) {
        if (votacionIds == null) return;
        for (UUID votacionId : votacionIds) {
            if (votacionProyectoRepository.existsByVotacion_IdAndProyecto_Id(votacionId, proyecto.getId())) continue;

            VotacionMO votacion = votacionRepository.findById(votacionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Votación no encontrada."));

            VotacionProyectoMO relacion = new VotacionProyectoMO();
            relacion.setProyecto(proyecto);
            relacion.setVotacion(votacion);
            votacionProyectoRepository.save(relacion);
        }
    }

    public VotacionProyectoMO obtener(UUID id) {
        return votacionProyectoRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se ha encontrado la opción de votación."));
    }
}