package com.Votify.backend.facade;

import java.math.BigDecimal;
import java.util.List;
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
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.dto.EmitirVotoPuntosRequest;
import com.Votify.backend.dto.EmitirVotoSimpleRequest;
import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.ModalidadVotacionMO;
import com.Votify.backend.model.TipoEventoMO;
import com.Votify.backend.model.TipoVotacionMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.model.VotoMO;
import com.Votify.backend.service.ComentarioService;
import com.Votify.backend.service.CriterioEvaluacionService;
import com.Votify.backend.service.PuntuacionCriterioService;
import com.Votify.backend.service.VotacionProyectoService;
import com.Votify.backend.service.VotoCriterioService;
import com.Votify.backend.service.VotoService;

@ExtendWith(MockitoExtension.class)
class VotoFacadeTest {

    @Mock private VotoService votoService;
    @Mock private VotacionProyectoService votacionProyectoService;
    @Mock private CriterioEvaluacionService criterioEvaluacionService;
    @Mock private PuntuacionCriterioService puntuacionCriterioService;
    @Mock private VotoCriterioService votoCriterioService;
    @Mock private ComentarioService comentarioService;

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

    // ============ votarSimple ============

    @Test
    void votarSimple_caminoFeliz_guardaVotoYDelega() {
        when(votacionProyectoService.obtener(vpId)).thenReturn(vp);
        when(votoService.save(any(VotoMO.class))).thenAnswer(inv -> inv.getArgument(0));

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "token123", null, null);

        VotoMO resultado = votoFacade.votarSimple(req);

        assertThat(resultado).isNotNull();
        assertThat(resultado.getAnonTokenHash()).isEqualTo("token123");
        verify(votoService).validarRequestBase(vpId, "token123");
        verify(votoService).exigirModalidad(votacion, ModalidadVotacionMO.SIMPLE);
        verify(votoService).validarEstadoYFechas(votacion);
        verify(votoService).validarMaximoYDuplicado(votacion, vp, "token123");
        verify(votoService).save(any(VotoMO.class));
        verify(comentarioService).guardarComentarioGlobal(eq(vp), eq("token123"), eq(null));
    }

    @Test
    void votarSimple_propagaErrorDeRequestBaseDelService() {
        doThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "El token del votante es obligatorio."))
            .when(votoService).validarRequestBase(any(), any());

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "  ", null, null);

        assertThatThrownBy(() -> votoFacade.votarSimple(req))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("token");

        verify(votoService, never()).save(any());
        verifyNoInteractions(votacionProyectoService);
    }

    @Test
    void votarSimple_propagaErrorDeModalidadDelService() {
        when(votacionProyectoService.obtener(vpId)).thenReturn(vp);
        doThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "La votación no es de tipo simple."))
            .when(votoService).exigirModalidad(votacion, ModalidadVotacionMO.SIMPLE);

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "tk", null, null);

        assertThatThrownBy(() -> votoFacade.votarSimple(req))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("simple");

        verify(votoService, never()).save(any());
    }

    @Test
    void votarSimple_propagaErrorDeMaximoDelService() {
        when(votacionProyectoService.obtener(vpId)).thenReturn(vp);
        doThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Ya has alcanzado el número máximo"))
            .when(votoService).validarMaximoYDuplicado(any(), any(), any());

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "tk", null, null);

        assertThatThrownBy(() -> votoFacade.votarSimple(req))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("máximo");

        verify(votoService, never()).save(any());
    }

    @Test
    void votarSimple_conComentario_guardaComentarioGlobal() {
        when(votacionProyectoService.obtener(vpId)).thenReturn(vp);
        when(votoService.save(any(VotoMO.class))).thenAnswer(inv -> inv.getArgument(0));

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "tk", null, "Buen proyecto");

        votoFacade.votarSimple(req);

        verify(comentarioService).guardarComentarioGlobal(vp, "tk", "Buen proyecto");
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

    @Test
    void votarPuntos_caminoFeliz_persisteConPuntuacionTotal() {
        votacion.setModalidad(ModalidadVotacionMO.PUNTOS);
        when(votacionProyectoService.obtener(vpId)).thenReturn(vp);
        when(votoService.save(any(VotoMO.class))).thenAnswer(inv -> inv.getArgument(0));

        EmitirVotoPuntosRequest req = new EmitirVotoPuntosRequest(vpId, "tk", null, 7, null);

        VotoMO resultado = votoFacade.votarPuntos(req);

        assertThat(resultado.getPuntuacionTotal()).isEqualByComparingTo(BigDecimal.valueOf(7));
        verify(votoService).exigirModalidad(votacion, ModalidadVotacionMO.PUNTOS);
    }

    // ============ haAlcanzadoMaximo ============

    @Test
    void haAlcanzadoMaximo_tokenVacio_devuelveFalse() {
        boolean resultado = votoFacade.haAlcanzadoMaximo(UUID.randomUUID(), "");
        assertThat(resultado).isFalse();
        verifyNoInteractions(votacionProyectoService);
    }

    @Test
    void haAlcanzadoMaximo_emitidosIgualMax_devuelveTrue() {
        UUID votacionId = UUID.randomUUID();
        when(votacionProyectoService.findByVotacion_Id(votacionId)).thenReturn(List.of(vp));
        when(votoService.haAlcanzadoMaximo(vp, "tk")).thenReturn(true);

        assertThat(votoFacade.haAlcanzadoMaximo(votacionId, "tk")).isTrue();
    }
}