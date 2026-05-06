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
import com.Votify.backend.service.EventoService;

@ExtendWith(MockitoExtension.class)
class EventoFacadeTest {

    @Mock private EventoService eventoService;

    @InjectMocks private EventoFacade eventoFacade;

    @Test
    void crear_tipoHackathon_delegaEnFabricaYPersisteConTipoCorrecto() {
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.plusDays(2);
        when(eventoService.normalizarOCrearCodigo("ABC")).thenReturn("ABC");
        when(eventoService.save(any(EventoMO.class))).thenAnswer(inv -> inv.getArgument(0));

        EventoMO resultado = eventoFacade.crear(
            "HACKATHON", "Hackathon UPV", "Descripción", "ABC", inicio, fin, true
        );

        ArgumentCaptor<EventoMO> captor = ArgumentCaptor.forClass(EventoMO.class);
        verify(eventoService).save(captor.capture());
        EventoMO guardado = captor.getValue();

        assertThat(guardado.getTipoEvento()).isEqualTo(TipoEventoMO.HACKATHON);
        assertThat(guardado.getNombre()).isEqualTo("Hackathon UPV");
        assertThat(guardado.getCodigoAccesoPublico()).isEqualTo("ABC");
        assertThat(guardado.isAutoVotacion()).isTrue();
        assertThat(resultado).isSameAs(guardado);
    }

    @Test
    void crear_tipoFeriaInovacion_delegaEnFabricaYPersisteConTipoCorrecto() {
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.plusDays(3);
        when(eventoService.normalizarOCrearCodigo(any())).thenReturn("XYZ");
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