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
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.domain.Evento;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.TipoEventoMO;
import com.Votify.backend.service.CompetidorEventoService;
import com.Votify.backend.service.CriterioEvaluacionService;
import com.Votify.backend.service.EquipoService;
import com.Votify.backend.service.EventoOrganizadorService;
import com.Votify.backend.service.EventoService;
import com.Votify.backend.service.ProyectoService;
import com.Votify.backend.service.VotacionService;

@ExtendWith(MockitoExtension.class)
class EventoFacadeTest {

    @Mock private EventoService eventoService;
    @Mock private VotacionService votacionService;
    @Mock private CriterioEvaluacionService criterioEvaluacionService;
    @Mock private CompetidorEventoService competidorEventoService;
    @Mock private EventoOrganizadorService eventoOrganizadorService;
    @Mock private ProyectoService proyectoService;
    @Mock private EquipoService equipoService;

    @InjectMocks private EventoFacade eventoFacade;

    /** Helper: hace que crearDesdeDominio devuelva un EventoMO equivalente al dominio recibido. */
    private void mockCrearDesdeDominioEcho() {
        when(eventoService.crearDesdeDominio(any())).thenAnswer(inv -> {
            Evento d = inv.getArgument(0);
            EventoMO mo = new EventoMO();
            mo.setNombre(d.getNombre());
            mo.setDescripcion(d.getDescripcion());
            mo.setCodigoAccesoPublico(d.getCodigoAccesoPublico());
            mo.setTipoEvento(d.tipo());
            mo.setFecha_inicio(d.getFechaInicio());
            mo.setFecha_fin(d.getFechaFin());
            mo.setAutoVotacion(d.isAutoVotacion());
            return mo;
        });
    }

    @Test
    void crear_tipoHackathon_delegaEnFabricaYPersisteConTipoCorrecto() {
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.plusDays(2);
        when(eventoService.normalizarOCrearCodigo(any())).thenReturn("ABC");
        mockCrearDesdeDominioEcho();

        EventoMO resultado = eventoFacade.crear(
            "HACKATHON", "Hackathon UPV", "Descripcion", "ABC", inicio, fin, true
        );

        ArgumentCaptor<Evento> captor = ArgumentCaptor.forClass(Evento.class);
        verify(eventoService).crearDesdeDominio(captor.capture());
        Evento dominio = captor.getValue();

        assertThat(dominio.tipo()).isEqualTo(TipoEventoMO.HACKATHON);
        assertThat(dominio.getNombre()).isEqualTo("Hackathon UPV");
        assertThat(dominio.isAutoVotacion()).isTrue();
        assertThat(resultado.getTipoEvento()).isEqualTo(TipoEventoMO.HACKATHON);
        assertThat(resultado.getNombre()).isEqualTo("Hackathon UPV");
    }

    @Test
    void crear_tipoFeriaInovacion_delegaEnFabricaYPersisteConTipoCorrecto() {
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.plusDays(3);
        when(eventoService.normalizarOCrearCodigo(any())).thenReturn(null);
        mockCrearDesdeDominioEcho();

        eventoFacade.crear("FERIA_INOVACION", "Feria", "Desc", null, inicio, fin, false);

        ArgumentCaptor<Evento> captor = ArgumentCaptor.forClass(Evento.class);
        verify(eventoService).crearDesdeDominio(captor.capture());
        assertThat(captor.getValue().tipo()).isEqualTo(TipoEventoMO.FERIA_INOVACION);
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

        verify(eventoService, never()).crearDesdeDominio(any());
    }

    @Test
    void crear_codigoNullSeAcepta() {
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.plusDays(1);
        when(eventoService.normalizarOCrearCodigo(any())).thenReturn(null);
        mockCrearDesdeDominioEcho();

        EventoMO resultado = eventoFacade.crear("HACKATHON", "n", "d", null, inicio, fin, false);

        assertThat(resultado.getCodigoAccesoPublico()).isNull();
    }

    @Test
    void crear_tipoMinusculasFunciona() {
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.plusDays(1);
        when(eventoService.normalizarOCrearCodigo(any())).thenReturn("X");
        mockCrearDesdeDominioEcho();

        eventoFacade.crear("hackathon", "n", "d", "c", inicio, fin, false);

        ArgumentCaptor<Evento> captor = ArgumentCaptor.forClass(Evento.class);
        verify(eventoService).crearDesdeDominio(captor.capture());
        assertThat(captor.getValue().tipo()).isEqualTo(TipoEventoMO.HACKATHON);
    }

    @Test
    void crear_tipoConEspacios_funciona() {
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.plusDays(1);
        when(eventoService.normalizarOCrearCodigo(any())).thenReturn("X");
        mockCrearDesdeDominioEcho();

        eventoFacade.crear("  HACKATHON  ", "n", "d", "c", inicio, fin, false);

        verify(eventoService).crearDesdeDominio(any());
    }

    @Test
    void crear_propagaErrorDeValidacionDelService() {
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.plusDays(1);
        org.mockito.Mockito.doThrow(new ResponseStatusException(
            org.springframework.http.HttpStatus.BAD_REQUEST, "El nombre del evento es obligatorio."))
            .when(eventoService).validarDatosCreacion(any(), any(), any(), any(), any());

        assertThatThrownBy(() -> eventoFacade.crear(
            "HACKATHON", "  ", "d", "c", inicio, fin, false
        )).isInstanceOf(ResponseStatusException.class)
          .hasMessageContaining("nombre");

        verify(eventoService, never()).crearDesdeDominio(any());
    }
}