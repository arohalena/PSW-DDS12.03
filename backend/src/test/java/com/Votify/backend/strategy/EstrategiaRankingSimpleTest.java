package com.Votify.backend.strategy;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotoRepository;

@ExtendWith(MockitoExtension.class)
class EstrategiaRankingSimpleTest {

    @Mock private EquipoRepository equipoRepository;
    @Mock private VotacionProyectoRepository votacionProyectoRepository;
    @Mock private VotoRepository votoRepository;

    @InjectMocks private EstrategiaRankingSimple estrategia;

    private VotacionProyectoMO nuevoVp(String nombreProyecto, EquipoMO equipoDirecto) {
        ProyectoMO proyecto = new ProyectoMO();
        proyecto.setId(UUID.randomUUID());
        proyecto.setNombre(nombreProyecto);
        proyecto.setEquipo(equipoDirecto);

        VotacionProyectoMO vp = new VotacionProyectoMO();
        vp.setId(UUID.randomUUID());
        vp.setProyecto(proyecto);
        return vp;
    }

    @Test
    void calcular_devuelveTotalVotosComoPuntuacion() {

        UUID eventoId = UUID.randomUUID();
        UUID votacionId = UUID.randomUUID();

        EquipoMO equipo = new EquipoMO();
        equipo.setNombre("Equipo X");

        VotacionProyectoMO vp = nuevoVp("Proyecto A", null);

        when(votacionProyectoRepository.findByVotacion_Id(votacionId)).thenReturn(List.of(vp));
        when(votoRepository.countDistinctVotantesByEventoId(eventoId)).thenReturn(5L);
        when(votoRepository.countByVotacionProyecto_Id(vp.getId())).thenReturn(3L);
        when(equipoRepository.findByProyecto_Id(vp.getProyecto().getId())).thenReturn(equipo);

        List<Map<String, Object>> ranking = estrategia.calcular(eventoId, votacionId);

        assertThat(ranking).hasSize(1);
        Map<String, Object> entry = ranking.get(0);
        assertThat(entry.get("totalVotos")).isEqualTo(3L);
        assertThat(entry.get("puntuacionTotal")).isEqualTo(3.0);
        assertThat(entry.get("proyectoNombre")).isEqualTo("Proyecto A");
        assertThat(entry.get("equipoNombre")).isEqualTo("Equipo X");
        assertThat(entry.get("votantesActivos")).isEqualTo(5L);
        assertThat((List<?>) entry.get("criterios")).isEmpty();
    }

    @Test
    void calcular_sinProyectos_devuelveListaVacia() {

        UUID eventoId = UUID.randomUUID();
        UUID votacionId = UUID.randomUUID();

        when(votacionProyectoRepository.findByVotacion_Id(votacionId)).thenReturn(List.of());
        when(votoRepository.countDistinctVotantesByEventoId(eventoId)).thenReturn(0L);

        List<Map<String, Object>> ranking = estrategia.calcular(eventoId, votacionId);

        assertThat(ranking).isEmpty();
    }

    @Test
    void calcular_equipoEnProyecto_noConsultaRepositorioDeEquipos() {

        UUID eventoId = UUID.randomUUID();
        UUID votacionId = UUID.randomUUID();

        EquipoMO equipoDirecto = new EquipoMO();
        equipoDirecto.setNombre("Equipo Directo");

        VotacionProyectoMO vp = nuevoVp("Proyecto A", equipoDirecto);

        when(votacionProyectoRepository.findByVotacion_Id(votacionId)).thenReturn(List.of(vp));
        when(votoRepository.countDistinctVotantesByEventoId(eventoId)).thenReturn(2L);
        when(votoRepository.countByVotacionProyecto_Id(vp.getId())).thenReturn(1L);

        List<Map<String, Object>> ranking = estrategia.calcular(eventoId, votacionId);

        assertThat(ranking.get(0).get("equipoNombre")).isEqualTo("Equipo Directo");
        verify(equipoRepository, never()).findByProyecto_Id(any());
    }

    @Test
    void calcular_variosProyectos_calculaCadaUnoPorSeparado() {

        UUID eventoId = UUID.randomUUID();
        UUID votacionId = UUID.randomUUID();

        VotacionProyectoMO vp1 = nuevoVp("Proyecto A", null);
        VotacionProyectoMO vp2 = nuevoVp("Proyecto B", null);

        when(votacionProyectoRepository.findByVotacion_Id(votacionId)).thenReturn(List.of(vp1, vp2));
        when(votoRepository.countDistinctVotantesByEventoId(eventoId)).thenReturn(10L);
        when(votoRepository.countByVotacionProyecto_Id(vp1.getId())).thenReturn(7L);
        when(votoRepository.countByVotacionProyecto_Id(vp2.getId())).thenReturn(2L);
        when(equipoRepository.findByProyecto_Id(any())).thenReturn(null);

        List<Map<String, Object>> ranking = estrategia.calcular(eventoId, votacionId);

        assertThat(ranking).hasSize(2);
        assertThat(ranking.get(0).get("puntuacionTotal")).isEqualTo(7.0);
        assertThat(ranking.get(1).get("puntuacionTotal")).isEqualTo(2.0);
    }
}