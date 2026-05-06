package com.Votify.backend.facade;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.dto.EmitirVotoPuntosRequest;
import com.Votify.backend.dto.EmitirVotoSimpleRequest;
import com.Votify.backend.model.ComentarioMO;
import com.Votify.backend.model.CompetidorMO;
import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.ModalidadVotacionMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.RolMO;
import com.Votify.backend.model.TipoEventoMO;
import com.Votify.backend.model.TipoVotacionMO;
import com.Votify.backend.model.UsuarioMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.model.VotoMO;
import com.Votify.backend.repository.ComentarioRepository;
import com.Votify.backend.repository.CompetidorEventoRepository;
import com.Votify.backend.repository.CompetidorRepository;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
import com.Votify.backend.repository.UsuarioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotoCriterioRepository;
import com.Votify.backend.service.CriterioEvaluacionService;
import com.Votify.backend.service.VotoService;

@ExtendWith(MockitoExtension.class)
class VotoFacadeTest {

    @Mock private VotoService votoService;
    @Mock private CriterioEvaluacionService criterioEvaluacionService;
    @Mock private VotacionProyectoRepository votacionProyectoRepository;
    @Mock private VotoCriterioRepository votoCriterioRepository;
    @Mock private PuntuacionCriterioRepository puntuacionCriterioRepository;
    @Mock private ComentarioRepository comentarioRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private CompetidorRepository competidorRepository;
    @Mock private EquipoRepository equipoRepository;
    @Mock private CompetidorEventoRepository competidorEventoRepository;

    @InjectMocks private VotoFacade votoFacade;

    private UUID vpId;
    private VotacionProyectoMO vp;
    private VotacionMO votacion;

    @BeforeEach
    void setUp() {
        vpId = UUID.randomUUID();

        EventoMO evento = new EventoMO();
        evento.setTipoEvento(TipoEventoMO.HACKATHON);
        evento.setAutoVotacion(true);

        votacion = new VotacionMO();
        votacion.setId(UUID.randomUUID());
        votacion.setModalidad(ModalidadVotacionMO.SIMPLE);
        votacion.setTipo(TipoVotacionMO.POPULAR);
        votacion.setMaxSelecciones(3);
        votacion.setEstado(EstadoVotacionMO.ABIERTA);
        votacion.setComentariosActivos(false);
        votacion.setComentarioObligatorio(false);
        votacion.setEvento(evento);

        vp = new VotacionProyectoMO();
        vp.setId(vpId);
        vp.setVotacion(votacion);
    }

    @Test
    void votarSimple_caminoFeliz_guardaVotoYDelegaEnVotoService() {
        when(votacionProyectoRepository.findById(vpId)).thenReturn(Optional.of(vp));
        when(votoService.contarVotosEmitidosEnVotacion(any(), eq("token123"))).thenReturn(0L);
        when(votoService.yaHaVotado(vpId, "token123")).thenReturn(false);
        when(votoService.save(any(VotoMO.class))).thenAnswer(inv -> inv.getArgument(0));

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "token123", null, null);

        VotoMO resultado = votoFacade.votarSimple(req);

        assertThat(resultado).isNotNull();
        assertThat(resultado.getAnonTokenHash()).isEqualTo("token123");
        verify(votoService).save(any(VotoMO.class));
        verify(comentarioRepository, never()).save(any());
    }

    @Test
    void votarSimple_sinToken_lanza400() {
        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "  ", null, null);

        assertThatThrownBy(() -> votoFacade.votarSimple(req))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("token");

        verifyNoInteractions(votoService);
    }

    @Test
    void votarSimple_yaHaVotado_lanza409YNoGuarda() {
        when(votacionProyectoRepository.findById(vpId)).thenReturn(Optional.of(vp));
        when(votoService.contarVotosEmitidosEnVotacion(any(), eq("tk"))).thenReturn(0L);
        when(votoService.yaHaVotado(vpId, "tk")).thenReturn(true);

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "tk", null, null);

        assertThatThrownBy(() -> votoFacade.votarSimple(req))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Ya hab");  // sin tilde, evita problema de encoding

        verify(votoService, never()).save(any());
    }

    // ============ MODALIDAD ============

    @Test
    void votarSimple_modalidadIncorrecta_lanza400() {
        votacion.setModalidad(ModalidadVotacionMO.PUNTOS);
        when(votacionProyectoRepository.findById(vpId)).thenReturn(Optional.of(vp));

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "tk", null, null);

        assertThatThrownBy(() -> votoFacade.votarSimple(req))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("simple");
        verify(votoService, never()).save(any());
    }

    // ============ ESTADO DE VOTACIÓN ============

    @Test
    void votarSimple_estadoPausada_lanza400() {
        votacion.setEstado(EstadoVotacionMO.PAUSADA);
        when(votacionProyectoRepository.findById(vpId)).thenReturn(Optional.of(vp));

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "tk", null, null);

        assertThatThrownBy(() -> votoFacade.votarSimple(req))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("pausada");
        verify(votoService, never()).save(any());
    }

    @Test
    void votarSimple_estadoCerrada_lanza400() {
        votacion.setEstado(EstadoVotacionMO.CERRADA);
        when(votacionProyectoRepository.findById(vpId)).thenReturn(Optional.of(vp));

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "tk", null, null);

        assertThatThrownBy(() -> votoFacade.votarSimple(req))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("finalizado");
        verify(votoService, never()).save(any());
    }

    @Test
    void votarSimple_finPasado_devuelveCerrada_lanza400() {
        // estado=ABIERTA pero fin en el pasado → getEstadoActual() debe devolver CERRADA
        votacion.setEstado(EstadoVotacionMO.ABIERTA);
        votacion.setFin(java.time.OffsetDateTime.now().minusHours(1));
        when(votacionProyectoRepository.findById(vpId)).thenReturn(Optional.of(vp));

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "tk", null, null);

        assertThatThrownBy(() -> votoFacade.votarSimple(req))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("finalizado");
    }

    // ============ COMENTARIOS ============

    @Test
    void votarSimple_comentarioCuandoNoActivos_lanza400() {
        votacion.setComentariosActivos(false);
        when(votacionProyectoRepository.findById(vpId)).thenReturn(Optional.of(vp));

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "tk", null, "comentario no permitido");

        assertThatThrownBy(() -> votoFacade.votarSimple(req))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("no permite comentarios");
        verify(votoService, never()).save(any());
    }

    @Test
    void votarSimple_comentarioObligatorioVacio_lanza400() {
        votacion.setComentariosActivos(true);
        votacion.setComentarioObligatorio(true);
        when(votacionProyectoRepository.findById(vpId)).thenReturn(Optional.of(vp));

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "tk", null, "  ");

        assertThatThrownBy(() -> votoFacade.votarSimple(req))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("obligatorio");
        verify(votoService, never()).save(any());
    }

    @Test
    void votarSimple_conComentario_guardaComentarioGlobal() {
        votacion.setComentariosActivos(true);
        when(votacionProyectoRepository.findById(vpId)).thenReturn(Optional.of(vp));
        when(votoService.contarVotosEmitidosEnVotacion(any(), eq("tk"))).thenReturn(0L);
        when(votoService.yaHaVotado(vpId, "tk")).thenReturn(false);
        when(votoService.save(any(VotoMO.class))).thenAnswer(inv -> inv.getArgument(0));

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "tk", null, "Buen proyecto");

        votoFacade.votarSimple(req);

        verify(comentarioRepository).save(any(ComentarioMO.class));
    }

    // ============ JURADO ============

    @Test
    void votarSimple_juradoSinUsuarioId_lanza403() {
        votacion.setTipo(TipoVotacionMO.JURADO);
        when(votacionProyectoRepository.findById(vpId)).thenReturn(Optional.of(vp));

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "tk", null, null);

        assertThatThrownBy(() -> votoFacade.votarSimple(req))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("jurado");
        verify(votoService, never()).save(any());
    }

    @Test
    void votarSimple_juradoUsuarioConRolPublico_lanza403() {
        votacion.setTipo(TipoVotacionMO.JURADO);
        UUID usuarioId = UUID.randomUUID();
        UsuarioMO usuario = new UsuarioMO();
        usuario.setRol(RolMO.PUBLICO); // si este enum no existe, cambia a otro que NO sea JURADO ni ORGANIZADOR

        when(votacionProyectoRepository.findById(vpId)).thenReturn(Optional.of(vp));
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(usuario));

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "tk", usuarioId, null);

        assertThatThrownBy(() -> votoFacade.votarSimple(req))
            .isInstanceOf(ResponseStatusException.class);
        verify(votoService, never()).save(any());
    }

    // ============ MAX SELECCIONES ============

    @Test
    void votarSimple_alcanzadoMaximo_lanza409() {
        when(votacionProyectoRepository.findById(vpId)).thenReturn(Optional.of(vp));
        when(votoService.contarVotosEmitidosEnVotacion(any(), eq("tk"))).thenReturn(3L); // == max=3

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "tk", null, null);

        assertThatThrownBy(() -> votoFacade.votarSimple(req))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("máximo");
        verify(votoService, never()).save(any());
        verify(votoService, never()).yaHaVotado(any(), any()); // ni siquiera llega a comprobar duplicado
    }

    // ============ AUTO-VOTACIÓN ============

    @Test
    void votarSimple_autoVotacionMismoEquipo_lanza403() {
        EventoMO eventoSinAuto = votacion.getEvento();
        eventoSinAuto.setAutoVotacion(false);

        UUID usuarioId = UUID.randomUUID();
        UUID proyectoId = UUID.randomUUID();
        UUID equipoId = UUID.randomUUID();
        UUID competidorId = UUID.randomUUID();

        ProyectoMO proyecto = new ProyectoMO();
        proyecto.setId(proyectoId);
        vp.setProyecto(proyecto);  // ← clave: si no, NPE en validarAutoVotacion

        CompetidorMO competidor = new CompetidorMO();
        competidor.setId(competidorId);
        EquipoMO equipo = new EquipoMO();
        equipo.setId(equipoId);

        when(votacionProyectoRepository.findById(vpId)).thenReturn(Optional.of(vp));
        when(competidorRepository.findByUsuarioId(usuarioId)).thenReturn(Optional.of(competidor));
        when(equipoRepository.findByProyecto_Id(proyectoId)).thenReturn(equipo);
        when(competidorEventoRepository.existsByCompetidor_IdAndEquipo_Id(competidorId, equipoId))
            .thenReturn(true);

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "tk", usuarioId, null);

        assertThatThrownBy(() -> votoFacade.votarSimple(req))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("propio proyecto");
    }

    // ============ votarPuntos ============

    @Test
    void votarPuntos_puntuacionCero_lanza400() {
        EmitirVotoPuntosRequest req = new EmitirVotoPuntosRequest(vpId, "tk", null, 0, null);

        assertThatThrownBy(() -> votoFacade.votarPuntos(req))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("entre 1 y 10");
        verify(votoService, never()).save(any());
    }

    @Test
    void votarPuntos_puntuacionMayor10_lanza400() {
        EmitirVotoPuntosRequest req = new EmitirVotoPuntosRequest(vpId, "tk", null, 11, null);

        assertThatThrownBy(() -> votoFacade.votarPuntos(req))
            .isInstanceOf(ResponseStatusException.class);
        verify(votoService, never()).save(any());
    }

    // ============ haAlcanzadoMaximo ============

    @Test
    void haAlcanzadoMaximo_tokenVacio_devuelveFalse() {
        boolean resultado = votoFacade.haAlcanzadoMaximo(UUID.randomUUID(), "");
        assertThat(resultado).isFalse();
        verifyNoInteractions(votacionProyectoRepository);
    }

    @Test
    void haAlcanzadoMaximo_emitidosIgualMax_devuelveTrue() {
        UUID votacionId = UUID.randomUUID();
        when(votacionProyectoRepository.findByVotacion_Id(votacionId))
            .thenReturn(java.util.List.of(vp));
        when(votoService.contarVotosEmitidosEnVotacion(votacionId, "tk")).thenReturn(3L);

        assertThat(votoFacade.haAlcanzadoMaximo(votacionId, "tk")).isTrue();
    }
}