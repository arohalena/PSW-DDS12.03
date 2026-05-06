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

import com.Votify.backend.dto.EmitirVotoSimpleRequest;
import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.ModalidadVotacionMO;
import com.Votify.backend.model.TipoEventoMO;
import com.Votify.backend.model.TipoVotacionMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.model.VotoMO;
import com.Votify.backend.repository.ComentarioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.service.VotoService;

@ExtendWith(MockitoExtension.class)
class VotoFacadeTest {

    @Mock private VotoService votoService;
    @Mock private VotacionProyectoRepository votacionProyectoRepository;
    @Mock private ComentarioRepository comentarioRepository;
    
    @InjectMocks private VotoFacade votoFacade;

    private UUID vpId;
    private VotacionProyectoMO vp;
    private VotacionMO votacion;

    @BeforeEach
    @SuppressWarnings("unused")
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
        // given
        when(votacionProyectoRepository.findById(vpId)).thenReturn(Optional.of(vp));
        when(votoService.contarVotosEmitidosEnVotacion(any(), eq("token123"))).thenReturn(0L);
        when(votoService.yaHaVotado(vpId, "token123")).thenReturn(false);
        when(votoService.save(any(VotoMO.class))).thenAnswer(inv -> inv.getArgument(0));

        EmitirVotoSimpleRequest req = new EmitirVotoSimpleRequest(vpId, "token123", null, null);

        // when
        VotoMO resultado = votoFacade.votarSimple(req);

        // then
        assertThat(resultado).isNotNull();
        assertThat(resultado.getAnonTokenHash()).isEqualTo("token123");
        verify(votoService).save(any(VotoMO.class));
        verify(comentarioRepository, never()).save(any()); // sin comentario
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
            .hasMessageContaining("Ya habías votado");

        verify(votoService, never()).save(any());
    }
}