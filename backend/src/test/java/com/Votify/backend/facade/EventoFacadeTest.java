package com.Votify.backend.facade;

import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.TipoEventoMO;
import com.Votify.backend.repository.ComentarioRepository;
import com.Votify.backend.repository.CompetidorEventoRepository;
import com.Votify.backend.repository.CriterioEvaluacionRepository;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.EventoOrganizadorRepository;
import com.Votify.backend.repository.ProyectoRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotacionRepository;
import com.Votify.backend.repository.VotoCriterioRepository;
import com.Votify.backend.repository.VotoRepository;
import com.Votify.backend.service.EventoService;

@ExtendWith(MockitoExtension.class)
class EventoFacadeTest {

    @Mock private EventoService eventoService;
    @Mock private ProyectoRepository proyectoRepository;
    @Mock private EquipoRepository equipoRepository;
    @Mock private CompetidorEventoRepository competidorEventoRepository;
    @Mock private EventoOrganizadorRepository eventoOrganizadorRepository;
    @Mock private VotacionRepository votacionRepository;
    @Mock private VotacionProyectoRepository votacionProyectoRepository;
    @Mock private VotoRepository votoRepository;
    @Mock private VotoCriterioRepository votoCriterioRepository;
    @Mock private PuntuacionCriterioRepository puntuacionCriterioRepository;
    @Mock private ComentarioRepository comentarioRepository;
    @Mock private CriterioEvaluacionRepository criterioEvaluacionRepository;

    @InjectMocks private EventoFacade eventoFacade;

    @Test
    void crear_tipoHackathon_delegaEnFabricaYPersisteConTipoCorrecto() {
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.plusDays(2);
        when(eventoService.normalizarOCrearCodigo(any())).thenReturn("ABC");
        when(eventoService.save(any(EventoMO.class))).thenAnswer(inv -> inv.getArgument(0));

        EventoMO resultado = eventoFacade.crear(
            "HACKATHON", "Hackathon UPV", "Descripcion", "ABC", inicio, fin, true
        );

        ArgumentCaptor<EventoMO> captor = ArgumentCaptor.forClass(EventoMO.class);
        verify(eventoService).save(captor.capture());
        EventoMO guardado = captor.getValue();

        assertThat(guardado.getTipoEvento()).isEqualTo(TipoEventoMO.HACKATHON);
        assertThat(guardado.getNombre()).isEqualTo("Hackathon UPV");
        assertThat(guardado.isAutoVotacion()).isTrue();
        assertThat(resultado).isSameAs(guardado);
    }

    @Test
    void crear_tipoFeriaInovacion_delegaEnFabricaYPersisteConTipoCorrecto() {
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.plusDays(3);
        when(eventoService.normalizarOCrearCodigo(any())).thenReturn(null);
        when(eventoService.save(any(EventoMO.class))).thenAnswer(inv -> inv.getArgument(0));

        eventoFacade.crear("FERIA_INOVACION", "Feria", "Desc", null, inicio, fin, false);

        ArgumentCaptor<EventoMO> captor = ArgumentCaptor.forClass(EventoMO.class);
        verify(eventoService).save(captor.capture());
        assertThat(captor.getValue().getTipoEvento()).isEqualTo(TipoEventoMO.FERIA_INOVACION);
    }

    @Test
    void crear_tipoNoReconocido_lanza400YNoPersiste() {
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.plusDays(1);
        when(eventoService.normalizarOCrearCodigo(any())).thenReturn("X");

        assertThatThrownBy(() -> eventoFacade.crear(
            "DESCONOCIDO", "n", "d", "c", inicio, fin, false
        )).isInstanceOf(ResponseStatusException.class)
          .hasMessageContaining("tipo de evento");

        verify(eventoService, never()).save(any());
    }

    @Test
    void crear_nombreVacio_lanza400() {
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.plusDays(1);

        assertThatThrownBy(() -> eventoFacade.crear(
            "HACKATHON", "  ", "d", "c", inicio, fin, false
        )).isInstanceOf(ResponseStatusException.class)
          .hasMessageContaining("nombre");

        verifyNoInteractions(eventoService);
    }

    @Test
    void crear_fechaFinAntesQueInicio_lanza400() {
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.minusDays(1);

        assertThatThrownBy(() -> eventoFacade.crear(
            "HACKATHON", "n", "d", "c", inicio, fin, false
        )).isInstanceOf(ResponseStatusException.class)
          .hasMessageContaining("fecha de fin");

        verifyNoInteractions(eventoService);
    }
}