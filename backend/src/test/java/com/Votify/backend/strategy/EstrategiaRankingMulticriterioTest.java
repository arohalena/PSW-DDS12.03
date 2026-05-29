package com.Votify.backend.strategy;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.Votify.backend.model.CriterioEvaluacionMO;
import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.repository.CriterioEvaluacionRepository;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotoRepository;

@ExtendWith(MockitoExtension.class)
class EstrategiaRankingMulticriterioTest {

    @Mock private EquipoRepository equipoRepository;
    @Mock private CriterioEvaluacionRepository criterioRepository;
    @Mock private PuntuacionCriterioRepository puntuacionRepository;
    @Mock private VotacionProyectoRepository votacionProyectoRepository;
    @Mock private VotoRepository votoRepository;

    @InjectMocks private EstrategiaRankingMulticriterio estrategia;

    private CriterioEvaluacionMO criterio(String nombre, int peso) {
        CriterioEvaluacionMO c = new CriterioEvaluacionMO();
        c.setId(UUID.randomUUID());
        c.setNombre(nombre);
        c.setPeso(peso);
        return c;
    }

    private VotacionProyectoMO nuevoVp() {
        ProyectoMO proyecto = new ProyectoMO();
        proyecto.setId(UUID.randomUUID());
        proyecto.setNombre("Proyecto A");

        VotacionProyectoMO vp = new VotacionProyectoMO();
        vp.setId(UUID.randomUUID());
        vp.setProyecto(proyecto);
        return vp;
    }

    @Test
    void calcular_promedioSinPonderar_esMediaDeCriterios() {

        UUID eventoId = UUID.randomUUID();
        UUID votacionId = UUID.randomUUID();

        VotacionProyectoMO vp = nuevoVp();

        EquipoMO equipo = new EquipoMO();
        equipo.setNombre("Equipo X");

        CriterioEvaluacionMO c1 = criterio("Innovación", 60);
        CriterioEvaluacionMO c2 = criterio("Viabilidad", 40);

        when(criterioRepository.findByEvento_IdOrderByOrdenAsc(eventoId)).thenReturn(List.of(c1, c2));
        when(votacionProyectoRepository.findByVotacion_Id(votacionId)).thenReturn(List.of(vp));
        when(votoRepository.countDistinctVotantesByEventoId(eventoId)).thenReturn(4L);
        when(votoRepository.countByVotacionProyecto_Id(vp.getId())).thenReturn(4L);
        when(puntuacionRepository.promedioByCriterioAndVotacionProyecto(c1.getId(), vp.getId())).thenReturn(8.0);
        when(puntuacionRepository.promedioByCriterioAndVotacionProyecto(c2.getId(), vp.getId())).thenReturn(6.0);
        when(equipoRepository.findByProyecto_Id(vp.getProyecto().getId())).thenReturn(equipo);

        List<Map<String, Object>> ranking = estrategia.calcular(eventoId, votacionId);

        assertThat(ranking).hasSize(1);
        Map<String, Object> entry = ranking.get(0);
        // Sin ponderar: media de promedios = (8 + 6) / 2 = 7.0
        assertThat(entry.get("puntuacionTotal")).isEqualTo(7.0);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> criterios = (List<Map<String, Object>>) entry.get("criterios");
        assertThat(criterios).hasSize(2);
        assertThat(criterios.get(0).get("peso")).isNull();
        assertThat(criterios.get(0).get("ponderado")).isNull();
        assertThat(criterios.get(0).get("promedio")).isEqualTo(8.0);
        assertThat(criterios.get(1).get("promedio")).isEqualTo(6.0);
    }

    @Test
    void calcular_sinCriterios_puntuacionTotalEsCeroYNoHayDivisionPorCero() {

        UUID eventoId = UUID.randomUUID();
        UUID votacionId = UUID.randomUUID();

        VotacionProyectoMO vp = nuevoVp();

        when(criterioRepository.findByEvento_IdOrderByOrdenAsc(eventoId)).thenReturn(List.of());
        when(votacionProyectoRepository.findByVotacion_Id(votacionId)).thenReturn(List.of(vp));
        when(votoRepository.countDistinctVotantesByEventoId(eventoId)).thenReturn(4L);
        when(votoRepository.countByVotacionProyecto_Id(vp.getId())).thenReturn(4L);
        when(equipoRepository.findByProyecto_Id(vp.getProyecto().getId())).thenReturn(null);

        List<Map<String, Object>> ranking = estrategia.calcular(eventoId, votacionId);

        Map<String, Object> entry = ranking.get(0);
        assertThat(entry.get("puntuacionTotal")).isEqualTo(0.0);
        assertThat((List<?>) entry.get("criterios")).isEmpty();
    }

    @Test
    void calcular_promedioNull_seTrataComoCero() {

        UUID eventoId = UUID.randomUUID();
        UUID votacionId = UUID.randomUUID();

        VotacionProyectoMO vp = nuevoVp();

        CriterioEvaluacionMO c1 = criterio("Innovación", 50);
        CriterioEvaluacionMO c2 = criterio("Viabilidad", 50);

        when(criterioRepository.findByEvento_IdOrderByOrdenAsc(eventoId)).thenReturn(List.of(c1, c2));
        when(votacionProyectoRepository.findByVotacion_Id(votacionId)).thenReturn(List.of(vp));
        when(votoRepository.countDistinctVotantesByEventoId(eventoId)).thenReturn(2L);
        when(votoRepository.countByVotacionProyecto_Id(vp.getId())).thenReturn(2L);
        // c1 sin puntuaciones (null) -> 0 ; c2 = 6
        when(puntuacionRepository.promedioByCriterioAndVotacionProyecto(c1.getId(), vp.getId())).thenReturn(null);
        when(puntuacionRepository.promedioByCriterioAndVotacionProyecto(c2.getId(), vp.getId())).thenReturn(6.0);
        when(equipoRepository.findByProyecto_Id(vp.getProyecto().getId())).thenReturn(null);

        List<Map<String, Object>> ranking = estrategia.calcular(eventoId, votacionId);

        Map<String, Object> entry = ranking.get(0);
        // media = (0 + 6) / 2 = 3.0
        assertThat(entry.get("puntuacionTotal")).isEqualTo(3.0);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> criterios = (List<Map<String, Object>>) entry.get("criterios");
        assertThat(criterios.get(0).get("promedio")).isEqualTo(0.0);
    }
}