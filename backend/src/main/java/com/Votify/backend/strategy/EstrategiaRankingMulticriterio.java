package com.Votify.backend.strategy;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.Votify.backend.model.CriterioEvaluacionMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.repository.CriterioEvaluacionRepository;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotoRepository;

@Component
public class EstrategiaRankingMulticriterio extends EstrategiaCalculoRanking {

    private final CriterioEvaluacionRepository criterioRepository;
    private final PuntuacionCriterioRepository puntuacionRepository;
    private final VotacionProyectoRepository votacionProyectoRepository;
    private final VotoRepository votoRepository;

    public EstrategiaRankingMulticriterio(EquipoRepository equipoRepository,
                                          CriterioEvaluacionRepository criterioRepository,
                                          PuntuacionCriterioRepository puntuacionRepository,
                                          VotacionProyectoRepository votacionProyectoRepository,
                                          VotoRepository votoRepository) {
        super(equipoRepository);
        this.criterioRepository = criterioRepository;
        this.puntuacionRepository = puntuacionRepository;
        this.votacionProyectoRepository = votacionProyectoRepository;
        this.votoRepository = votoRepository;
    }

    protected boolean esPonderada() {
        return false;
    }

    @Override
    public List<Map<String, Object>> calcular(UUID eventoId, UUID votacionId) {

        List<CriterioEvaluacionMO> criterios = criterioRepository.findByEvento_IdOrderByOrdenAsc(eventoId);
        List<VotacionProyectoMO> proyectosVotacion = votacionProyectoRepository.findByVotacion_Id(votacionId);
        long votantesActivos = votoRepository.countDistinctVotantesByEventoId(eventoId);

        List<Map<String, Object>> ranking = new ArrayList<>();
        boolean ponderada = esPonderada();

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
                    ? avg * criterio.getPeso() / PRECISION_REDONDEO
                    : avg;

                puntuacionTotal += aporte;

                Map<String, Object> detalle = new LinkedHashMap<>();
                detalle.put("criterioId", criterio.getId());
                detalle.put("criterioNombre", criterio.getNombre());
                detalle.put("peso", ponderada ? criterio.getPeso() : null);
                detalle.put("promedio", redondear(avg));
                detalle.put("ponderado", ponderada ? redondear(aporte) : null);

                detalleCriterios.add(detalle);
            }

            if (!ponderada && !criterios.isEmpty()) {
                puntuacionTotal = puntuacionTotal / criterios.size();
            }

            entry.put("puntuacionTotal", redondear(puntuacionTotal));
            entry.put("criterios", detalleCriterios);

            ranking.add(entry);
        }

        return ranking;
    }
}