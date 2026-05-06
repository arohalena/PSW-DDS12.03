package com.Votify.backend.facade;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

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

import com.Votify.backend.dto.CrearProyectoRequest;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.TipoCategoriaMO;
import com.Votify.backend.repository.ComentarioRepository;
import com.Votify.backend.repository.CompetidorEventoRepository;
import com.Votify.backend.repository.CompetidorRepository;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.EventoRepository;
import com.Votify.backend.repository.ProyectoRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
import com.Votify.backend.repository.UsuarioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotacionRepository;
import com.Votify.backend.repository.VotoCriterioRepository;
import com.Votify.backend.repository.VotoRepository;
import com.Votify.backend.service.ProyectoService;
import com.Votify.backend.service.RankingService;

@ExtendWith(MockitoExtension.class)
class ProyectoFacadeTest {

    @Mock private ProyectoService proyectoService;
    @Mock private EventoRepository eventoRepository;
    @Mock private EquipoRepository equipoRepository;
    @Mock private CompetidorRepository competidorRepository;
    @Mock private CompetidorEventoRepository competidorEventoRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private ComentarioRepository comentarioRepository;
    @Mock private VotacionRepository votacionRepository;
    @Mock private VotacionProyectoRepository votacionProyectoRepository;
    @Mock private VotoRepository votoRepository;
    @Mock private RankingService rankingService;
    @Mock private ProyectoRepository proyectoRepository;
    @Mock private PuntuacionCriterioRepository puntuacionCriterioRepository;
    @Mock private VotoCriterioRepository votoCriterioRepository;

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

        when(eventoRepository.findById(eventoId)).thenReturn(Optional.of(evento));
        when(proyectoService.save(any(ProyectoMO.class))).thenAnswer(inv -> inv.getArgument(0));

        ProyectoMO resultado = proyectoFacade.crearSimple(entrada);

        ArgumentCaptor<ProyectoMO> captor = ArgumentCaptor.forClass(ProyectoMO.class);
        verify(proyectoService).save(captor.capture());
        ProyectoMO guardado = captor.getValue();
        assertThat(guardado.getTipoCategoria()).isEqualTo(TipoCategoriaMO.IA);
        assertThat(guardado.getNombre()).isEqualTo("EcoIA");
        assertThat(guardado.getEvento()).isSameAs(evento);
        assertThat(resultado).isSameAs(guardado);
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

        when(eventoRepository.findById(eventoId)).thenReturn(Optional.of(evento));
        when(proyectoService.save(any(ProyectoMO.class))).thenAnswer(inv -> inv.getArgument(0));

        proyectoFacade.crearSimple(entrada);

        ArgumentCaptor<ProyectoMO> captor = ArgumentCaptor.forClass(ProyectoMO.class);
        verify(proyectoService).save(captor.capture());
        assertThat(captor.getValue().getTipoCategoria()).isEqualTo(TipoCategoriaMO.SOSTENIBILIDAD);
    }

    @Test
    void crearSimple_sinTipoCategoria_lanza400YNoPersiste() {
        ProyectoMO entrada = new ProyectoMO();
        entrada.setNombre("X");
        entrada.setTipoCategoria(null);

        assertThatThrownBy(() -> proyectoFacade.crearSimple(entrada))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("tipo de proyecto");

        verifyNoInteractions(proyectoService);
        verifyNoInteractions(eventoRepository);
    }

    @Test
    void crearConEquipo_categoriaInvalida_lanza400() {
        UUID eventoId = UUID.randomUUID();
        EventoMO evento = new EventoMO();
        evento.setId(eventoId);
        when(eventoRepository.findById(eventoId)).thenReturn(Optional.of(evento));

        CrearProyectoRequest request = new CrearProyectoRequest(
            "Proyecto", "Desc", "  ", "Equipo", Collections.emptyList(), eventoId
        );

        assertThatThrownBy(() -> proyectoFacade.crearConEquipo(request))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("categor");  // sin tilde

        verifyNoInteractions(proyectoService);
    }

    @Test
    void crearConEquipo_eventoNoEncontrado_lanza404() {
        UUID eventoId = UUID.randomUUID();
        // sin stub: Mockito devuelve Optional.empty() por defecto

        CrearProyectoRequest request = new CrearProyectoRequest(
            "Proyecto", "Desc", "IA", "Equipo", Collections.emptyList(), eventoId
        );

        assertThatThrownBy(() -> proyectoFacade.crearConEquipo(request))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Evento");

        verifyNoInteractions(proyectoService);
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

        // sin stub: findById devuelve Optional.empty()

        assertThatThrownBy(() -> proyectoFacade.crearSimple(entrada))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Evento");

        verify(proyectoService, never()).save(any());
    }

    @Test
    void findAll_delegaEnProyectoService() {
        when(proyectoService.findAll()).thenReturn(java.util.Collections.emptyList());

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