package com.Votify.backend.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.ModalidadVotacionMO;
import com.Votify.backend.model.ModoRankingMO;
import com.Votify.backend.model.RolMO;
import com.Votify.backend.model.TipoVotacionMO;
import com.Votify.backend.model.UsuarioMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.model.VotoMO;
<<<<<<< HEAD
import com.Votify.backend.repository.EquipoRepository;
=======
import com.Votify.backend.repository.CriterioEvaluacionRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
>>>>>>> a270b1b02eca3a5f507424dd86870cd71b0a47bc
import com.Votify.backend.repository.UsuarioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotacionRepository;
import com.Votify.backend.repository.VotoRepository;
import com.Votify.backend.strategy.EstrategiaCalculoRanking;
import com.Votify.backend.strategy.EstrategiaRankingMulticriterio;
import com.Votify.backend.strategy.EstrategiaRankingMulticriterioPonderada;
import com.Votify.backend.strategy.EstrategiaRankingPuntos;
import com.Votify.backend.strategy.EstrategiaRankingSimple;

@Service
public class RankingService {

    private static final double PRECISION_REDONDEO = 100.0;

    private final VotacionProyectoRepository votacionProyectoRepository;
    private final VotoRepository votoRepository;
    private final VotacionRepository votacionRepository;
    private final UsuarioRepository usuarioRepository;

    private final EstrategiaRankingSimple estrategiaSimple;
    private final EstrategiaRankingPuntos estrategiaPuntos;
    private final EstrategiaRankingMulticriterio estrategiaMulticriterio;
    private final EstrategiaRankingMulticriterioPonderada estrategiaMulticriterioPonderada;

    public RankingService(VotacionProyectoRepository votacionProyectoRepository,
                          VotoRepository votoRepository,
                          EquipoRepository equipoRepository,
                          VotacionRepository votacionRepository,
                          UsuarioRepository usuarioRepository,
                          EstrategiaRankingSimple estrategiaSimple,
                          EstrategiaRankingPuntos estrategiaPuntos,
                          @Qualifier("estrategiaRankingMulticriterio") EstrategiaRankingMulticriterio estrategiaMulticriterio,
                          @Qualifier("estrategiaRankingMulticriterioPonderada") EstrategiaRankingMulticriterioPonderada estrategiaMulticriterioPonderada) {

        this.votacionProyectoRepository = votacionProyectoRepository;
        this.votoRepository = votoRepository;
        this.equipoRepository = equipoRepository;
        this.votacionRepository = votacionRepository;
        this.usuarioRepository = usuarioRepository;
        this.estrategiaSimple = estrategiaSimple;
        this.estrategiaPuntos = estrategiaPuntos;
        this.estrategiaMulticriterio = estrategiaMulticriterio;
        this.estrategiaMulticriterioPonderada = estrategiaMulticriterioPonderada;
    }

    public List<Map<String, Object>> calcularRanking(UUID eventoId, UUID votacionId) {

        VotacionMO votacion = votacionRepository.findById(votacionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se ha encontrado la votación."));

        EstrategiaCalculoRanking estrategia = switch (votacion.getModalidad()) {
            case SIMPLE -> estrategiaSimple;
            case PUNTOS -> estrategiaPuntos;
            case MULTICRITERIO -> estrategiaMulticriterio;
            case MULTICRITERIO_PONDERADA -> estrategiaMulticriterioPonderada;
        };

        List<Map<String, Object>> ranking = estrategia.calcular(eventoId, votacionId);

        // Si es votación MIXTA
        if (votacion.getTipo() == TipoVotacionMO.MIXTA) {
            ranking = rankingMixto(eventoId, votacionId, votacion);
        }

        ModoRankingMO modo = votacion.getModoRanking() != null ? votacion.getModoRanking() : ModoRankingMO.AUTOMATICO;

        for (Map<String, Object> entry : ranking) {
            entry.put("modoRanking", modo.name());
        }

        if (modo == ModoRankingMO.MANUAL) {
            List<Map<String, Object>> rankingManual = aplicarOrdenManual(ranking, votacionId);
            return marcarResultadoFinal(rankingManual, votacion);
        }

        return marcarResultadoFinal(ordenarYNumerar(ranking), votacion);
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

        if (rol == RolMO.JURADO && (votacion.getTipo() == TipoVotacionMO.JURADO || votacion.getTipo() == TipoVotacionMO.MIXTA)) return;

        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
            "Solo el organizador o un jurado en votaciones de jurado/mixta pueden modificar el ranking.");
    }

    private List<Map<String, Object>> rankingMixto(UUID eventoId, UUID votacionId, VotacionMO votacion) {

        int pesoPopular = Objects.requireNonNullElse(votacion.getPesoPorcentajePopular(), 50);
        int pesoJurado  = Objects.requireNonNullElse(votacion.getPesoPorcentajeJurado(),  50);

        List<VotacionProyectoMO> proyectosVotacion = votacionProyectoRepository.findByVotacion_Id(votacionId);
        long votantesActivos = votoRepository.countDistinctVotantesByEventoId(eventoId);

        List<Map<String, Object>> ranking = new ArrayList<>();

        for (VotacionProyectoMO vp : proyectosVotacion) {

            Map<String, Object> entry = baseEntry(vp, votantesActivos);

            List<VotoMO> todosLosVotos = votoRepository.findByVotacionProyecto_Id(vp.getId());

            // Separar votos de jurado
            List<VotoMO> votosJurado  = new ArrayList<>();
            List<VotoMO> votosPopular = new ArrayList<>();

            for (VotoMO voto : todosLosVotos) {
                UsuarioMO usuario = voto.getUsuario();
                if (usuario != null &&
                    (usuario.getRol() == RolMO.JURADO || usuario.getRol() == RolMO.ORGANIZADOR)) {
                    votosJurado.add(voto);
                } else {
                    votosPopular.add(voto);
                }
            }

            // Calcular puntuación popular
            double puntosPopular = calcularPuntuacionVotos(votosPopular, votacion.getModalidad());
            // Calcular puntuación jurado
            double puntosJurado  = calcularPuntuacionVotos(votosJurado,  votacion.getModalidad());

            double puntuacionTotal = (puntosPopular * pesoPopular / 100.0) + (puntosJurado * pesoJurado / 100.0);

            entry.put("totalVotos",       todosLosVotos.size());
            entry.put("votosPopular",     votosPopular.size());
            entry.put("votosJurado",      votosJurado.size());
            entry.put("puntosPopular",    Math.round(puntosPopular * PRECISION_REDONDEO) / PRECISION_REDONDEO);
            entry.put("puntosJurado",     Math.round(puntosJurado  * PRECISION_REDONDEO) / PRECISION_REDONDEO);
            entry.put("pesoPopular",      pesoPopular);
            entry.put("pesoJurado",       pesoJurado);
            entry.put("puntuacionTotal",  Math.round(puntuacionTotal * PRECISION_REDONDEO) / PRECISION_REDONDEO);
            entry.put("criterios",        new ArrayList<>());

            ranking.add(entry);
        }

        return ranking;
    }

    // Calcular la puntuación de un conjunto de votos según la modalidad
    private double calcularPuntuacionVotos(List<VotoMO> votos, ModalidadVotacionMO modalidad) {
        if (votos.isEmpty()) return 0;

        return switch (modalidad) {
            case SIMPLE -> votos.size();
            case PUNTOS -> {
                double suma = 0;
                for (VotoMO v : votos) {
                    if (v.getPuntuacionTotal() != null) suma += v.getPuntuacionTotal().doubleValue();
                }
                yield suma;
            }
            case MULTICRITERIO, MULTICRITERIO_PONDERADA -> {
                double suma = 0;
                int count = 0;
                for (VotoMO v : votos) {
                    if (v.getPuntuacionTotal() != null) {
                        suma += v.getPuntuacionTotal().doubleValue();
                        count++;
                    }
                }
                yield count > 0 ? suma / count : 0;
            }
        };
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

    private Map<String, Object> baseEntry(VotacionProyectoMO vp, long votantesActivos) {

        Map<String, Object> entry = new LinkedHashMap<>();

        entry.put("proyectoId", vp.getProyecto().getId());
        entry.put("proyectoNombre", vp.getProyecto().getNombre());
        entry.put("votacionProyectoId", vp.getId());

        EquipoMO equipo = vp.getProyecto().getEquipo();
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

    private List<Map<String, Object>> marcarResultadoFinal(List<Map<String, Object>> ranking, VotacionMO votacion) {
        boolean cerrada = votacion.getEstadoActual() == EstadoVotacionMO.CERRADA;
        boolean publicado = votacion.isResultadosPublicados();
        boolean resultadoFinal = cerrada && publicado;

        for (Map<String, Object> entry : ranking) {
            int posicion = ((Number) entry.get("posicion")).intValue();
            entry.put("votacionCerrada", cerrada);
            entry.put("resultadosPublicados", publicado);
            entry.put("resultadoFinal", resultadoFinal);
            entry.put("fechaPublicacionResultados", votacion.getFechaPublicacionResultados());
            entry.put("ganador", resultadoFinal && posicion <= 3);
            entry.put("tipoPremio", resultadoFinal && posicion <= 3 ? tipoPremio(posicion) : null);
        }

        return ranking;
    }

    private String tipoPremio(int posicion) {
        return switch (posicion) {
            case 1 -> "ORO";
            case 2 -> "PLATA";
            case 3 -> "BRONCE";
            default -> null;
        };
    }
}