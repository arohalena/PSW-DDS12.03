package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.domain.Proyecto;
import com.Votify.backend.dto.ProyectoGestionRequest;
import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.TipoCategoriaMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.model.VotoMO;
import com.Votify.backend.repository.ComentarioRepository;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.ProyectoRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotoCriterioRepository;
import com.Votify.backend.repository.VotoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProyectoService extends GenericService<ProyectoMO> {

    private final ProyectoRepository proyectoRepository;
    private final VotacionProyectoRepository votacionProyectoRepository;
    private final VotoRepository votoRepository;
    private final VotoCriterioRepository votoCriterioRepository;
    private final ComentarioRepository comentarioRepository;
    private final PuntuacionCriterioRepository puntuacionCriterioRepository;
    private final EquipoRepository equipoRepository;

    @Override
    protected JpaRepository<ProyectoMO, UUID> getRepository() {
        return proyectoRepository;
    }

    public List<ProyectoMO> findByEvento_Id(UUID eventoId) {
        return proyectoRepository.findByEvento_Id(eventoId);
    }

    public List<ProyectoMO> findByEquipo_Id(UUID equipoId) {
        return proyectoRepository.findByEquipo_Id(equipoId);
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

    public void validarEquipoDisponibleEnEvento(UUID equipoId, UUID eventoId, UUID proyectoActualId) {
        if (equipoOcupadoEnEvento(equipoId, eventoId, proyectoActualId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Este equipo ya tiene otro proyecto asignado a este evento.");
        }
    }

    public void validarTipoCategoria(TipoCategoriaMO tipoCategoria) {
        if (tipoCategoria == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se reconoce el tipo de proyecto deseado.");
        }
    }

    public void validarCategoriaTexto(String categoria) {
        if (categoria == null || categoria.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La categoría es obligatoria.");
        }
    }

    public void validarDatosGestion(ProyectoGestionRequest request) {
        if (request.nombre() == null || request.nombre().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del proyecto es obligatorio.");
        }
        if (request.tipoCategoria() == null || request.tipoCategoria().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La categoría es obligatoria.");
        }
        if (request.equipoId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El equipo es obligatorio.");
        }
    }

    public ProyectoMO crearDesdeDominio(Proyecto dominio, EventoMO evento) {
        ProyectoMO entidad = new ProyectoMO();
        entidad.setNombre(dominio.getNombre());
        entidad.setDescripcion(dominio.getDescripcion());
        entidad.setTipoCategoria(dominio.categoria());
        entidad.setEvento(evento);
        return proyectoRepository.save(entidad);
    }

    public ProyectoMO guardarConDatos(ProyectoMO proyecto, String nombre, String descripcion, String categoria, EquipoMO equipo, EventoMO evento) {
        proyecto.actualizarDatos(nombre, descripcion, categoria, equipo, evento);
        return proyectoRepository.save(proyecto);
    }

    @Transactional
    public void desvincularDeEvento(UUID eventoId) {
        for (ProyectoMO proyecto : proyectoRepository.findByEvento_Id(eventoId)) {
            proyecto.setEvento(null);
            proyectoRepository.save(proyecto);
        }
    }

    @Transactional
    public void eliminarConCascada(UUID id) {
        ProyectoMO proyecto = proyectoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proyecto no encontrado."));

        for (VotacionProyectoMO votacionProyecto : votacionProyectoRepository.findByProyecto_Id(id)) {
            comentarioRepository.deleteAll(comentarioRepository.findByVotacionProyecto_Id(votacionProyecto.getId()));
            puntuacionCriterioRepository.deleteAll(puntuacionCriterioRepository.findByVotacionProyecto_Id(votacionProyecto.getId()));

            for (VotoMO voto : votoRepository.findByVotacionProyecto_Id(votacionProyecto.getId())) {
                votoCriterioRepository.deleteAll(votoCriterioRepository.findByVoto_Id(voto.getId()));
                votoRepository.delete(voto);
            }
            votacionProyectoRepository.delete(votacionProyecto);
        }

        comentarioRepository.deleteAll(comentarioRepository.findByProyecto_Id(id));

        EquipoMO equipo = equipoRepository.findByProyecto_Id(id);
        if (equipo != null) {
            equipo.setProyecto(null);
            equipoRepository.save(equipo);
        }
        proyecto.setEvento(null);
        proyecto.setEquipo(null);

        proyectoRepository.deleteById(proyecto.getId());
    }
}