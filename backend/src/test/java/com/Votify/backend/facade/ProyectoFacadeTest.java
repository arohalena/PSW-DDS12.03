package com.Votify.backend.facade;

import java.util.Collections;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.domain.Proyecto;
import com.Votify.backend.dto.CrearProyectoRequest;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.TipoCategoriaMO;
import com.Votify.backend.service.ComentarioService;
import com.Votify.backend.service.CompetidorEventoService;
import com.Votify.backend.service.CompetidorService;
import com.Votify.backend.service.EquipoService;
import com.Votify.backend.service.EventoService;
import com.Votify.backend.service.ProyectoService;
import com.Votify.backend.service.RankingService;
import com.Votify.backend.service.VotacionProyectoService;
import com.Votify.backend.service.VotacionService;
import com.Votify.backend.service.VotoService;

@ExtendWith(MockitoExtension.class)
class ProyectoFacadeTest {

    @Mock private ProyectoService proyectoService;
    @Mock private EventoService eventoService;
    @Mock private EquipoService equipoService;
    @Mock private CompetidorService competidorService;
    @Mock private CompetidorEventoService competidorEventoService;
    @Mock private VotacionService votacionService;
    @Mock private VotacionProyectoService votacionProyectoService;
    @Mock private VotoService votoService;
    @Mock private ComentarioService comentarioService;
    @Mock private RankingService rankingService;

    @InjectMocks private ProyectoFacade proyectoFacade;

    @Test
    void crearSimple_categoriaIA_usaLaFabricaCorrectaYPersiste() {
        UUID eventoId = UUID.randomUUID();
        EventoMO evento = new EventoMO();
        evento.setId(eventoId);

        ProyectoMO entrada = new ProyectoMO();
        entrada.setNombre("EcoIA");
        entrada.setDescripcion("Proyecto IA");
        entrada.setTipoCategoria(TipoCategoriaMO.IA);
        entrada.setEvento(evento);

        when(eventoService.obtener(eventoId)).thenReturn(evento);
        when(proyectoService.crearDesdeDominio(any(Proyecto.class), any(EventoMO.class)))
            .thenAnswer(inv -> {
                Proyecto d = inv.getArgument(0);
                EventoMO ev = inv.getArgument(1);
                ProyectoMO p = new ProyectoMO();
                p.setNombre(d.getNombre());
                p.setDescripcion(d.getDescripcion());
                p.setTipoCategoria(d.categoria());
                p.setEvento(ev);
                return p;
            });

        ProyectoMO resultado = proyectoFacade.crearSimple(entrada);

        ArgumentCaptor<Proyecto> captor = ArgumentCaptor.forClass(Proyecto.class);
        verify(proyectoService).crearDesdeDominio(captor.capture(), any(EventoMO.class));
        assertThat(captor.getValue().categoria()).isEqualTo(TipoCategoriaMO.IA);
        assertThat(resultado.getTipoCategoria()).isEqualTo(TipoCategoriaMO.IA);
        assertThat(resultado.getNombre()).isEqualTo("EcoIA");
        assertThat(resultado.getEvento()).isSameAs(evento);
    }

    @Test
    void crearSimple_categoriaSostenibilidad_usaLaFabricaCorrecta() {
        UUID eventoId = UUID.randomUUID();
        EventoMO evento = new EventoMO();
        evento.setId(eventoId);

        ProyectoMO entrada = new ProyectoMO();
        entrada.setNombre("Verde");
        entrada.setDescripcion("Reduce CO2");
        entrada.setTipoCategoria(TipoCategoriaMO.SOSTENIBILIDAD);
        entrada.setEvento(evento);

        when(eventoService.obtener(eventoId)).thenReturn(evento);
        when(proyectoService.crearDesdeDominio(any(), any())).thenAnswer(inv -> {
            Proyecto d = inv.getArgument(0);
            ProyectoMO p = new ProyectoMO();
            p.setTipoCategoria(d.categoria());
            return p;
        });

        proyectoFacade.crearSimple(entrada);

        ArgumentCaptor<Proyecto> captor = ArgumentCaptor.forClass(Proyecto.class);
        verify(proyectoService).crearDesdeDominio(captor.capture(), any());
        assertThat(captor.getValue().categoria()).isEqualTo(TipoCategoriaMO.SOSTENIBILIDAD);
    }

    @Test
    void crearSimple_sinTipoCategoria_propagaErrorDelService() {
        ProyectoMO entrada = new ProyectoMO();
        entrada.setNombre("X");
        entrada.setTipoCategoria(null);

        doThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se reconoce el tipo de proyecto deseado."))
            .when(proyectoService).validarTipoCategoria(null);

        assertThatThrownBy(() -> proyectoFacade.crearSimple(entrada))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("tipo de proyecto");

        verify(proyectoService, never()).crearDesdeDominio(any(), any());
    }

    @Test
    void crearConEquipo_categoriaInvalida_propagaErrorDelService() {
        UUID eventoId = UUID.randomUUID();
        EventoMO evento = new EventoMO();
        evento.setId(eventoId);
        when(eventoService.obtener(eventoId)).thenReturn(evento);
        doThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "La categoría es obligatoria."))
            .when(proyectoService).validarCategoriaTexto("  ");

        CrearProyectoRequest request = new CrearProyectoRequest(
            "Proyecto", "Desc", "  ", "Equipo", Collections.emptyList(), eventoId
        );

        assertThatThrownBy(() -> proyectoFacade.crearConEquipo(request))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("categor");

        verify(proyectoService, never()).crearDesdeDominio(any(), any());
    }

    @Test
    void crearConEquipo_eventoNoEncontrado_lanza404() {
        UUID eventoId = UUID.randomUUID();
        when(eventoService.obtener(eventoId))
            .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado."));

        CrearProyectoRequest request = new CrearProyectoRequest(
            "Proyecto", "Desc", "IA", "Equipo", Collections.emptyList(), eventoId
        );

        assertThatThrownBy(() -> proyectoFacade.crearConEquipo(request))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Evento");

        verify(proyectoService, never()).crearDesdeDominio(any(), any());
    }

    @Test
    void crearSimple_eventoNoEncontrado_lanza404() {
        UUID eventoId = UUID.randomUUID();
        EventoMO evento = new EventoMO();
        evento.setId(eventoId);

        ProyectoMO entrada = new ProyectoMO();
        entrada.setNombre("X");
        entrada.setTipoCategoria(TipoCategoriaMO.IA);
        entrada.setEvento(evento);

        when(eventoService.obtener(eventoId))
            .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento no encontrado."));

        assertThatThrownBy(() -> proyectoFacade.crearSimple(entrada))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Evento");

        verify(proyectoService, never()).crearDesdeDominio(any(), any());
    }

    @Test
    void findAll_delegaEnProyectoService() {
        when(proyectoService.findAll()).thenReturn(Collections.emptyList());

        proyectoFacade.findAll();

        verify(proyectoService).findAll();
    }

    @Test
    void findById_delegaEnProyectoService() {
        UUID id = UUID.randomUUID();
        ProyectoMO p = new ProyectoMO();
        when(proyectoService.findById(id)).thenReturn(p);

        ProyectoMO resultado = proyectoFacade.findById(id);

        assertThat(resultado).isSameAs(p);
        verify(proyectoService).findById(id);
    }
}