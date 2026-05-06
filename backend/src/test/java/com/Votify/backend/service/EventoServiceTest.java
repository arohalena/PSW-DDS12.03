package com.Votify.backend.service;

import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.repository.EventoRepository;

@ExtendWith(MockitoExtension.class)
class EventoServiceTest {

    @Mock private EventoRepository eventoRepository;
    @InjectMocks private EventoService eventoService;

    @Test
    void validarDatosCreacion_nombreVacio_lanza400() {
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.plusDays(1);

        assertThatThrownBy(() -> eventoService.validarDatosCreacion(
            "HACKATHON", "  ", "d", inicio, fin
        )).isInstanceOf(ResponseStatusException.class)
          .hasMessageContaining("nombre");
    }

    @Test
    void validarDatosCreacion_descripcionVacia_lanza400() {
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.plusDays(1);

        assertThatThrownBy(() -> eventoService.validarDatosCreacion(
            "HACKATHON", "Nombre", "  ", inicio, fin
        )).isInstanceOf(ResponseStatusException.class)
          .hasMessageContaining("descripci");
    }

    @Test
    void validarDatosCreacion_fechasNull_lanza400() {
        assertThatThrownBy(() -> eventoService.validarDatosCreacion(
            "HACKATHON", "n", "d", null, null
        )).isInstanceOf(ResponseStatusException.class)
          .hasMessageContaining("fechas");
    }

    @Test
    void validarDatosCreacion_fechaFinAntesQueInicio_lanza400() {
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.minusDays(1);

        assertThatThrownBy(() -> eventoService.validarDatosCreacion(
            "HACKATHON", "n", "d", inicio, fin
        )).isInstanceOf(ResponseStatusException.class)
          .hasMessageContaining("fecha de fin");
    }

    @Test
    void validarDatosCreacion_tipoVacio_lanza400() {
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.plusDays(1);

        assertThatThrownBy(() -> eventoService.validarDatosCreacion(
            "  ", "n", "d", inicio, fin
        )).isInstanceOf(ResponseStatusException.class)
          .hasMessageContaining("tipo de evento");
    }
}