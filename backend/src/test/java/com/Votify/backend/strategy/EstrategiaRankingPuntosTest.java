package com.Votify.backend.strategy;

import java.math.BigDecimal;
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

import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.model.VotoMO;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotoRepository;

@ExtendWith(MockitoExtension.class)
class EstrategiaRankingPuntosTest {

    @Mock private EquipoRepository equipoRepository;
    @Mock private VotacionProyectoRepository votacionProyectoRepository;
    @Mock private VotoRepository votoRepository;

    @InjectMocks private EstrategiaRankingPuntos estrategia;

    private VotoMO voto(Integer puntos) {
        VotoMO v = new VotoMO();
        if (puntos != null) {
            v.setPuntuacionTotal(BigDecimal.valueOf(puntos));
        }
        return v;
    }

    @Test
    void calcular_sumaPuntosYCalculaMedia() {

        UUID eventoId = UUID.randomUUID();
        UUID votacionId = UUID.randomUUID();

        ProyectoMO proyecto = new ProyectoMO();
        proyecto.setId(UUID.randomUUID());
        proyecto.setNombre("Proyecto A");

        VotacionProyectoMO vp = new VotacionProyectoMO();
        vp.setId(UUID.randomUUID());
        vp.setProyecto(proyecto);

        EquipoMO equipo = new EquipoMO();
        equipo.setNombre("Equipo X");

        when(votacionProyectoRepository.findByVotacion_Id(votacionId)).thenReturn(List.of(vp));
        when(votoRepository.countDistinctVotantesByEventoId(eventoId)).thenReturn(3L);
        when(votoRepository.findByVotacionProyecto_Id(vp.getId()))
                .thenReturn(List.of(voto(8), voto(5), voto(7)));
        when(equipoRepository.findByProyecto_Id(proyecto.getId())).thenReturn(equipo);

        List<Map<String, Object>> ranking = estrategia.calcular(eventoId, votacionId);

        assertThat(ranking).hasSize(1);
        Map<String, Object> entry = ranking.get(0);
        assertThat(entry.get("totalVotos")).isEqualTo(3L);
        assertThat(entry.get("sumaPuntos")).isEqualTo(20.0);
        assertThat(entry.get("mediaPuntos")).isEqualTo(6.67);
        assertThat(entry.get("puntuacionTotal")).isEqualTo(20.0);
    }

    @Test
    void calcular_sinVotos_devuelveCeroPuntos() {

        UUID eventoId = UUID.randomUUID();
        UUID votacionId = UUID.randomUUID();

        ProyectoMO proyecto = new ProyectoMO();
        proyecto.setId(UUID.randomUUID());
        proyecto.setNombre("Proyecto B");

        VotacionProyectoMO vp = new VotacionProyectoMO();
        vp.setId(UUID.randomUUID());
        vp.setProyecto(proyecto);

        when(votacionProyectoRepository.findByVotacion_Id(votacionId)).thenReturn(List.of(vp));
        when(votoRepository.countDistinctVotantesByEventoId(eventoId)).thenReturn(0L);
        when(votoRepository.findByVotacionProyecto_Id(vp.getId())).thenReturn(List.of());
        when(equipoRepository.findByProyecto_Id(proyecto.getId())).thenReturn(null);

        List<Map<String, Object>> ranking = estrategia.calcular(eventoId, votacionId);

        Map<String, Object> entry = ranking.get(0);
        assertThat(entry.get("totalVotos")).isEqualTo(0L);
        assertThat(entry.get("sumaPuntos")).isEqualTo(0.0);
        assertThat(entry.get("mediaPuntos")).isEqualTo(0.0);
        assertThat(entry.get("puntuacionTotal")).isEqualTo(0.0);
        assertThat(entry.get("equipoNombre")).isNull();
    }

    @Test
    void calcular_votoConPuntuacionNull_seIgnoraEnLaSumaPeroCuentaEnTotalVotos() {

        UUID eventoId = UUID.randomUUID();
        UUID votacionId = UUID.randomUUID();

        ProyectoMO proyecto = new ProyectoMO();
        proyecto.setId(UUID.randomUUID());
        proyecto.setNombre("Proyecto C");

        VotacionProyectoMO vp = new VotacionProyectoMO();
        vp.setId(UUID.randomUUID());
        vp.setProyecto(proyecto);

        when(votacionProyectoRepository.findByVotacion_Id(votacionId)).thenReturn(List.of(vp));
        when(votoRepository.countDistinctVotantesByEventoId(eventoId)).thenReturn(3L);
        // 3 votos pero uno sin puntuación: suma = 8 + 4 = 12, media = 12 / 3 = 4.0
        when(votoRepository.findByVotacionProyecto_Id(vp.getId()))
                .thenReturn(List.of(voto(8), voto(null), voto(4)));
        when(equipoRepository.findByProyecto_Id(proyecto.getId())).thenReturn(null);

        List<Map<String, Object>> ranking = estrategia.calcular(eventoId, votacionId);

        Map<String, Object> entry = ranking.get(0);
        assertThat(entry.get("totalVotos")).isEqualTo(3L);
        assertThat(entry.get("sumaPuntos")).isEqualTo(12.0);
        assertThat(entry.get("mediaPuntos")).isEqualTo(4.0);
    }

    @Test
    void calcular_mediaConDecimales_seRedondeaADosDecimales() {

        UUID eventoId = UUID.randomUUID();
        UUID votacionId = UUID.randomUUID();

        ProyectoMO proyecto = new ProyectoMO();
        proyecto.setId(UUID.randomUUID());
        proyecto.setNombre("Proyecto D");

        VotacionProyectoMO vp = new VotacionProyectoMO();
        vp.setId(UUID.randomUUID());
        vp.setProyecto(proyecto);

        when(votacionProyectoRepository.findByVotacion_Id(votacionId)).thenReturn(List.of(vp));
        when(votoRepository.countDistinctVotantesByEventoId(eventoId)).thenReturn(3L);
        // suma = 10, media = 10/3 = 3.333... -> 3.33
        when(votoRepository.findByVotacionProyecto_Id(vp.getId()))
                .thenReturn(List.of(voto(3), voto(3), voto(4)));
        when(equipoRepository.findByProyecto_Id(proyecto.getId())).thenReturn(null);

        List<Map<String, Object>> ranking = estrategia.calcular(eventoId, votacionId);

        Map<String, Object> entry = ranking.get(0);
        assertThat(entry.get("sumaPuntos")).isEqualTo(10.0);
        assertThat(entry.get("mediaPuntos")).isEqualTo(3.33);
    }
}