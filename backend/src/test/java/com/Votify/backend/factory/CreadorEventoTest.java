package com.Votify.backend.factory;

import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

import com.Votify.backend.domain.Evento;
import com.Votify.backend.domain.FeriaInovacionEvento;
import com.Votify.backend.domain.HackathonEvento;
import com.Votify.backend.model.TipoEventoMO;

class CreadorEventoTest {

    @Test
    void creadorHackathon_devuelveHackathonEventoConTipoCorrecto() {
        CreadorEvento creador = new CreadorHackathonEvento();
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.plusDays(2);

        Evento evento = creador.create(
            "Hackathon UPV", "Descripción del hackathon",
            "ABC123", inicio, fin, true
        );

        assertThat(evento).isInstanceOf(HackathonEvento.class);
        assertThat(evento.tipo()).isEqualTo(TipoEventoMO.HACKATHON);
        assertThat(evento.getNombre()).isEqualTo("Hackathon UPV");
        assertThat(evento.getDescripcion()).isEqualTo("Descripción del hackathon");
        assertThat(evento.getCodigoAccesoPublico()).isEqualTo("ABC123");
        assertThat(evento.getFechaInicio()).isEqualTo(inicio);
        assertThat(evento.getFechaFin()).isEqualTo(fin);
        assertThat(evento.isAutoVotacion()).isTrue();
    }

    @Test
    void creadorFeriaInovacion_devuelveFeriaInovacionEventoConTipoCorrecto() {
        CreadorEvento creador = new CreadorFeriaInovacion();
        OffsetDateTime inicio = OffsetDateTime.now();
        OffsetDateTime fin = inicio.plusDays(5);

        Evento evento = creador.create(
            "Feria Innovación", "Demo de proyectos",
            "XYZ999", inicio, fin, false
        );

        assertThat(evento).isInstanceOf(FeriaInovacionEvento.class);
        assertThat(evento.tipo()).isEqualTo(TipoEventoMO.FERIA_INOVACION);
        assertThat(evento.getNombre()).isEqualTo("Feria Innovación");
        assertThat(evento.isAutoVotacion()).isFalse();
    }

    @Test
    void cadaCreador_devuelveSubclaseDistintaDeEvento() {
        Evento eHack = new CreadorHackathonEvento()
            .create("a", "b", "c", OffsetDateTime.now(), OffsetDateTime.now().plusDays(1), false);
        Evento eFeria = new CreadorFeriaInovacion()
            .create("a", "b", "c", OffsetDateTime.now(), OffsetDateTime.now().plusDays(1), false);

        assertThat(eHack.getClass()).isNotEqualTo(eFeria.getClass());
        assertThat(eHack.tipo()).isNotEqualTo(eFeria.tipo());
    }
}