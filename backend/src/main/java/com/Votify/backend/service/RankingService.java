package com.Votify.backend.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.CriterioEvaluacionMO;
import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.ModalidadVotacionMO;
import com.Votify.backend.model.ModoRankingMO;
import com.Votify.backend.model.RolMO;
import com.Votify.backend.model.TipoVotacionMO;
import com.Votify.backend.model.UsuarioMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.model.VotoMO;
import com.Votify.backend.repository.CriterioEvaluacionRepository;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
import com.Votify.backend.repository.UsuarioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotacionRepository;
import com.Votify.backend.repository.VotoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RankingService {

    private final CriterioEvaluacionRepository criterioRepository;
    private final PuntuacionCriterioRepository puntuacionRepository;
    private final VotacionProyectoRepository votacionProyectoRepository;
    private final VotoRepository votoRepository;
    private final EquipoRepository equipoRepository;
    private final VotacionRepository votacionRepository;
    private final UsuarioRepository usuarioRepository;

    public List<Map<String, Object>> calcularRanking(UUID eventoId, UUID votacionId) {

        VotacionMO votacion = votacionRepository.findById(votacionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se ha encontrado la votación."));

        ModalidadVotacionMO modalidad = votacion.getModalidad();

        List<Map<String, Object>> ranking = switch (modalidad) {
            case SIMPLE -> rankingSimple(eventoId, votacionId);
            case PUNTOS -> rankingPuntos(eventoId, votacionId);
            case MULTICRITERIO -> rankingMulticriterio(eventoId, votacionId, false);
            case MULTICRITERIO_PONDERADA -> rankingMulticriterio(eventoId, votacionId, true);
        };

        ModoRankingMO modo = votacion.getModoRanking() != null ? votacion.getModoRanking() : ModoRankingMO.AUTOMATICO;

        for (Map<String, Object> entry : ranking) {
            entry.put("modoRanking", modo.name());
        }

        if (modo == ModoRankingMO.MANUAL) {
            return aplicarOrdenManual(ranking, votacionId);
        }

        return ordenarYNumerar(ranking);
    }

    @Transactional
    public void cambiarModo(UUID votacionId, UUID usuarioId, ModoRankingMO modo) {

        VotacionMO votacion = votacionRepository.findById(votacionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se ha encontrado la votación."));

        validarPermisoEdicion(votacion, usuarioId);

        if (modo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Modo de ranking no válido.");
        }

        votacion.setModoRanking(modo);
        votacionRepository.save(votacion);
    }

    @Transactional
    public void guardarOrdenManual(UUID votacionId, UUID usuarioId, List<Map<String, Object>> posiciones) {

        VotacionMO votacion = votacionRepository.findById(votacionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se ha encontrado la votación."));

        validarPermisoEdicion(votacion, usuarioId);

        if (posiciones == null || posiciones.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se han recibido posiciones.");
        }

        List<VotacionProyectoMO> proyectosVotacion = votacionProyectoRepository.findByVotacion_Id(votacionId);
        Map<UUID, VotacionProyectoMO> indexById = new HashMap<>();
        for (VotacionProyectoMO vp : proyectosVotacion) {
            indexById.put(vp.getId(), vp);
        }

        for (Map<String, Object> item : posiciones) {
            Object idRaw = item.get("votacionProyectoId");
            Object posRaw = item.get("posicion");
            if (idRaw == null || posRaw == null) continue;

            UUID vpId = UUID.fromString(idRaw.toString());
            int pos = ((Number) posRaw).intValue();

            VotacionProyectoMO vp = indexById.get(vpId);
            if (vp == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El proyecto " + vpId + " no pertenece a esta votación.");
            }
            vp.setPosicionManual(pos);
        }

        votacionProyectoRepository.saveAll(proyectosVotacion);

        if (votacion.getModoRanking() != ModoRankingMO.MANUAL) {
            votacion.setModoRanking(ModoRankingMO.MANUAL);
            votacionRepository.save(votacion);
        }
    }

    private void validarPermisoEdicion(VotacionMO votacion, UUID usuarioId) {

        if (usuarioId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Se requiere usuario para editar el ranking.");
        }

        UsuarioMO usuario = usuarioRepository.findById(usuarioId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario no encontrado."));

        RolMO rol = usuario.getRol();

        if (rol == RolMO.ORGANIZADOR) return;

        if (rol == RolMO.JURADO && votacion.getTipo() == TipoVotacionMO.JURADO) return;

        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
            "Solo el organizador o un jurado en votaciones de jurado pueden modificar el ranking.");
    }

    private List<Map<String, Object>> aplicarOrdenManual(List<Map<String, Object>> ranking, UUID votacionId) {

        List<VotacionProyectoMO> proyectosVotacion = votacionProyectoRepository.findByVotacion_Id(votacionId);
        Map<UUID, Integer> posicionesManuales = new HashMap<>();
        for (VotacionProyectoMO vp : proyectosVotacion) {
            if (vp.getPosicionManual() != null) {
                posicionesManuales.put(vp.getId(), vp.getPosicionManual());
            }
        }

        ranking.sort(Comparator.comparingInt(entry -> {
            UUID vpId = (UUID) entry.get("votacionProyectoId");
            Integer pos = posicionesManuales.get(vpId);
            return pos != null ? pos : Integer.MAX_VALUE;
        }));

        for (int i = 0; i < ranking.size(); i++) {
            ranking.get(i).put("posicion", i + 1);
        }

        return ranking;
    }

    private List<Map<String, Object>> rankingSimple(UUID eventoId, UUID votacionId) {

        List<VotacionProyectoMO> proyectosVotacion = votacionProyectoRepository.findByVotacion_Id(votacionId);
        long votantesActivos = votoRepository.countDistinctVotantesByEventoId(eventoId);

        List<Map<String, Object>> ranking = new ArrayList<>();

        for (VotacionProyectoMO vp : proyectosVotacion) {

            Map<String, Object> entry = baseEntry(vp, votantesActivos);

            long totalVotos = votoRepository.countByVotacionProyecto_Id(vp.getId());

            entry.put("totalVotos", totalVotos);
            entry.put("puntuacionTotal", (double) totalVotos);
            entry.put("criterios", new ArrayList<>());

            ranking.add(entry);
        }

        return ranking;
    }

    private List<Map<String, Object>> rankingPuntos(UUID eventoId, UUID votacionId) {

        List<VotacionProyectoMO> proyectosVotacion = votacionProyectoRepository.findByVotacion_Id(votacionId);
        long votantesActivos = votoRepository.countDistinctVotantesByEventoId(eventoId);

        List<Map<String, Object>> ranking = new ArrayList<>();

        for (VotacionProyectoMO vp : proyectosVotacion) {

            Map<String, Object> entry = baseEntry(vp, votantesActivos);

            List<VotoMO> votos = votoRepository.findByVotacionProyecto_Id(vp.getId());
            long totalVotos = votos.size();

            double sumaPuntos = 0;

            for (VotoMO v : votos) {
                if (v.getPuntuacionTotal() != null) {
                    sumaPuntos += v.getPuntuacionTotal().doubleValue();
                }
            }

            double mediaPuntos = totalVotos > 0 ? sumaPuntos / totalVotos : 0;

            entry.put("totalVotos", totalVotos);
            entry.put("sumaPuntos", Math.round(sumaPuntos * 100.0) / 100.0);
            entry.put("mediaPuntos", Math.round(mediaPuntos * 100.0) / 100.0);
            entry.put("puntuacionTotal", Math.round(sumaPuntos * 100.0) / 100.0);
            entry.put("criterios", new ArrayList<>());

            ranking.add(entry);
        }

        return ranking;
    }

    private List<Map<String, Object>> rankingMulticriterio(UUID eventoId, UUID votacionId, boolean ponderada) {

        List<CriterioEvaluacionMO> criterios = criterioRepository.findByEvento_IdOrderByOrdenAsc(eventoId);
        List<VotacionProyectoMO> proyectosVotacion = votacionProyectoRepository.findByVotacion_Id(votacionId);
        long votantesActivos = votoRepository.countDistinctVotantesByEventoId(eventoId);

        List<Map<String, Object>> ranking = new ArrayList<>();

        for (VotacionProyectoMO vp : proyectosVotacion) {

            Map<String, Object> entry = baseEntry(vp, votantesActivos);

            long totalVotos = votoRepository.countByVotacionProyecto_Id(vp.getId());
            entry.put("totalVotos", totalVotos);

            double puntuacionTotal = 0;
            List<Map<String, Object>> detalleCriterios = new ArrayList<>();

            for (CriterioEvaluacionMO criterio : criterios) {

                Double promedio = puntuacionRepository.promedioByCriterioAndVotacionProyecto(criterio.getId(), vp.getId());
                double avg = promedio != null ? promedio : 0;

                double aporte = ponderada
                    ? avg * criterio.getPeso() / 100.0
                    : avg;

                puntuacionTotal += aporte;

                Map<String, Object> detalle = new LinkedHashMap<>();
                detalle.put("criterioId", criterio.getId());
                detalle.put("criterioNombre", criterio.getNombre());
                detalle.put("peso", ponderada ? criterio.getPeso() : null);
                detalle.put("promedio", Math.round(avg * 100.0) / 100.0);
                detalle.put("ponderado", ponderada ? Math.round(aporte * 100.0) / 100.0 : null);

                detalleCriterios.add(detalle);
            }

            if (!ponderada && !criterios.isEmpty()) {
                puntuacionTotal = puntuacionTotal / criterios.size();
            }

            entry.put("puntuacionTotal", Math.round(puntuacionTotal * 100.0) / 100.0);
            entry.put("criterios", detalleCriterios);

            ranking.add(entry);
        }

        return ranking;
    }

    private Map<String, Object> baseEntry(VotacionProyectoMO vp, long votantesActivos) {

        Map<String, Object> entry = new LinkedHashMap<>();

        entry.put("proyectoId", vp.getProyecto().getId());
        entry.put("proyectoNombre", vp.getProyecto().getNombre());
        entry.put("votacionProyectoId", vp.getId());

        EquipoMO equipo = equipoRepository.findByProyecto_Id(vp.getProyecto().getId());
        entry.put("equipoNombre", equipo != null ? equipo.getNombre() : null);

        entry.put("votantesActivos", votantesActivos);

        return entry;
    }

    private List<Map<String, Object>> ordenarYNumerar(List<Map<String, Object>> ranking) {

        ranking.sort((a, b) -> Double.compare(
            ((Number) b.get("puntuacionTotal")).doubleValue(),
            ((Number) a.get("puntuacionTotal")).doubleValue()
        ));

        for (int i = 0; i < ranking.size(); i++) {
            ranking.get(i).put("posicion", i + 1);
        }

        return ranking;
    }
}