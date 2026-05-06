package com.Votify.backend.service;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.CompetidorMO;
import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.ModalidadVotacionMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.RolMO;
import com.Votify.backend.model.TipoVotacionMO;
import com.Votify.backend.model.UsuarioMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.repository.VotoRepository;

@ExtendWith(MockitoExtension.class)
class VotoServiceTest {

    @Mock private VotoRepository votoRepository;
    @Mock private VotacionProyectoService votacionProyectoService;
    @Mock private UsuarioService usuarioService;
    @Mock private CompetidorService competidorService;
    @Mock private EquipoService equipoService;
    @Mock private CompetidorEventoService competidorEventoService;

    @InjectMocks private VotoService votoService;

    private VotacionMO votacion;
    private VotacionProyectoMO vp;
    private EventoMO evento;
    private ProyectoMO proyecto;

    @BeforeEach
    void setUp() {
        evento = new EventoMO();
        evento.setId(UUID.randomUUID());
        evento.setAutoVotacion(true);

        votacion = new VotacionMO();
        votacion.setId(UUID.randomUUID());
        votacion.setEvento(evento);
        votacion.setModalidad(ModalidadVotacionMO.SIMPLE);
        votacion.setTipo(TipoVotacionMO.POPULAR);
        votacion.setMaxSelecciones(3);
        votacion.setEstado(EstadoVotacionMO.ABIERTA);
        votacion.setComentariosActivos(false);
        votacion.setComentarioObligatorio(false);

        proyecto = new ProyectoMO();
        proyecto.setId(UUID.randomUUID());

        vp = new VotacionProyectoMO();
        vp.setId(UUID.randomUUID());
        vp.setVotacion(votacion);
        vp.setProyecto(proyecto);
    }

    // ============ validarRequestBase ============

    @Test
    void validarRequestBase_votacionProyectoIdNull_lanza400() {
        assertThatThrownBy(() -> votoService.validarRequestBase(null, "tk"))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("opci");
    }

    @Test
    void validarRequestBase_tokenNull_lanza400() {
        assertThatThrownBy(() -> votoService.validarRequestBase(UUID.randomUUID(), null))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("token");
    }

    @Test
    void validarRequestBase_tokenBlank_lanza400() {
        assertThatThrownBy(() -> votoService.validarRequestBase(UUID.randomUUID(), "  "))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("token");
    }

    @Test
    void validarRequestBase_valido_noLanza() {
        assertThatCode(() -> votoService.validarRequestBase(UUID.randomUUID(), "tk"))
            .doesNotThrowAnyException();
    }

    // ============ exigirModalidad ============

    @Test
    void exigirModalidad_distintaDeLaEsperada_lanza400() {
        votacion.setModalidad(ModalidadVotacionMO.PUNTOS);

        assertThatThrownBy(() -> votoService.exigirModalidad(votacion, ModalidadVotacionMO.SIMPLE))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("simple");
    }

    @Test
    void exigirModalidad_coincide_noLanza() {
        votacion.setModalidad(ModalidadVotacionMO.PUNTOS);

        assertThatCode(() -> votoService.exigirModalidad(votacion, ModalidadVotacionMO.PUNTOS))
            .doesNotThrowAnyException();
    }

    // ============ exigirModalidadMulticriterio ============

    @Test
    void exigirModalidadMulticriterio_simple_lanza400() {
        votacion.setModalidad(ModalidadVotacionMO.SIMPLE);

        assertThatThrownBy(() -> votoService.exigirModalidadMulticriterio(votacion))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("multicriterio");
    }

    @Test
    void exigirModalidadMulticriterio_multicriterio_noLanza() {
        votacion.setModalidad(ModalidadVotacionMO.MULTICRITERIO);

        assertThatCode(() -> votoService.exigirModalidadMulticriterio(votacion))
            .doesNotThrowAnyException();
    }

    @Test
    void exigirModalidadMulticriterio_multicriterioPonderada_noLanza() {
        votacion.setModalidad(ModalidadVotacionMO.MULTICRITERIO_PONDERADA);

        assertThatCode(() -> votoService.exigirModalidadMulticriterio(votacion))
            .doesNotThrowAnyException();
    }

    // ============ validarEstadoYFechas ============

    @Test
    void validarEstadoYFechas_pendiente_lanza400() {
        votacion.setEstado(EstadoVotacionMO.PENDIENTE);
        votacion.setInicio(OffsetDateTime.now().plusDays(1));

        assertThatThrownBy(() -> votoService.validarEstadoYFechas(votacion))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("comenzado");
    }

    @Test
    void validarEstadoYFechas_pausada_lanza400() {
        votacion.setEstado(EstadoVotacionMO.PAUSADA);

        assertThatThrownBy(() -> votoService.validarEstadoYFechas(votacion))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("pausada");
    }

    @Test
    void validarEstadoYFechas_cerrada_lanza400() {
        votacion.setEstado(EstadoVotacionMO.CERRADA);

        assertThatThrownBy(() -> votoService.validarEstadoYFechas(votacion))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("finalizado");
    }

    @Test
    void validarEstadoYFechas_finPasado_lanza400() {
        votacion.setEstado(EstadoVotacionMO.ABIERTA);
        votacion.setFin(OffsetDateTime.now().minusHours(1));

        assertThatThrownBy(() -> votoService.validarEstadoYFechas(votacion))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("finalizado");
    }

    @Test
    void validarEstadoYFechas_abiertaSinFin_noLanza() {
        votacion.setEstado(EstadoVotacionMO.ABIERTA);
        votacion.setFin(null);

        assertThatCode(() -> votoService.validarEstadoYFechas(votacion))
            .doesNotThrowAnyException();
    }

    // ============ validarComentarios ============

    @Test
    void validarComentarios_comentarioCuandoNoActivos_lanza400() {
        votacion.setComentariosActivos(false);

        assertThatThrownBy(() -> votoService.validarComentarios(votacion, "comentario"))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("no permite");
    }

    @Test
    void validarComentarios_obligatorioYNull_lanza400() {
        votacion.setComentariosActivos(true);
        votacion.setComentarioObligatorio(true);

        assertThatThrownBy(() -> votoService.validarComentarios(votacion, null))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("obligatorio");
    }

    @Test
    void validarComentarios_obligatorioYBlank_lanza400() {
        votacion.setComentariosActivos(true);
        votacion.setComentarioObligatorio(true);

        assertThatThrownBy(() -> votoService.validarComentarios(votacion, "  "))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("obligatorio");
    }

    @Test
    void validarComentarios_inactivosYNull_noLanza() {
        votacion.setComentariosActivos(false);

        assertThatCode(() -> votoService.validarComentarios(votacion, null))
            .doesNotThrowAnyException();
    }

    @Test
    void validarComentarios_activosConTexto_noLanza() {
        votacion.setComentariosActivos(true);

        assertThatCode(() -> votoService.validarComentarios(votacion, "buen proyecto"))
            .doesNotThrowAnyException();
    }

    // ============ validarMaximoYDuplicado ============

    @Test
    void validarMaximoYDuplicado_emitidosIgualMax_lanza409() {
        when(votoRepository.countByVotacionProyecto_Votacion_IdAndAnonTokenHash(votacion.getId(), "tk"))
            .thenReturn(3L); // == max=3

        assertThatThrownBy(() -> votoService.validarMaximoYDuplicado(votacion, vp, "tk"))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("máximo");
    }

    @Test
    void validarMaximoYDuplicado_yaHaVotado_lanza409() {
        when(votoRepository.countByVotacionProyecto_Votacion_IdAndAnonTokenHash(votacion.getId(), "tk"))
            .thenReturn(0L);
        when(votoRepository.existsByVotacionProyecto_IdAndAnonTokenHash(vp.getId(), "tk"))
            .thenReturn(true);

        assertThatThrownBy(() -> votoService.validarMaximoYDuplicado(votacion, vp, "tk"))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Ya hab"); // sin tilde para evitar problemas de encoding
    }

    @Test
    void validarMaximoYDuplicado_dentroDeLimitesYNoVotado_noLanza() {
        when(votoRepository.countByVotacionProyecto_Votacion_IdAndAnonTokenHash(votacion.getId(), "tk"))
            .thenReturn(1L);
        when(votoRepository.existsByVotacionProyecto_IdAndAnonTokenHash(vp.getId(), "tk"))
            .thenReturn(false);

        assertThatCode(() -> votoService.validarMaximoYDuplicado(votacion, vp, "tk"))
            .doesNotThrowAnyException();
    }

    // ============ validarJurado ============

    @Test
    void validarJurado_votacionPopular_devuelveNull() {
        votacion.setTipo(TipoVotacionMO.POPULAR);

        UsuarioMO resultado = votoService.validarJurado(votacion, UUID.randomUUID());

        assertThat(resultado).isNull();
    }

    @Test
    void validarJurado_juradoSinUsuarioId_lanza403() {
        votacion.setTipo(TipoVotacionMO.JURADO);

        assertThatThrownBy(() -> votoService.validarJurado(votacion, null))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("jurado");
    }

    @Test
    void validarJurado_rolNoJurado_lanza403() {
        votacion.setTipo(TipoVotacionMO.JURADO);
        UUID usuarioId = UUID.randomUUID();
        UsuarioMO usuario = new UsuarioMO();
        usuario.setRol(RolMO.PUBLICO); // si tu enum tiene otro valor neutro, usa ese
        when(usuarioService.obtener(usuarioId)).thenReturn(usuario);

        assertThatThrownBy(() -> votoService.validarJurado(votacion, usuarioId))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("jurado");
    }

    @Test
    void validarJurado_rolJurado_devuelveUsuario() {
        votacion.setTipo(TipoVotacionMO.JURADO);
        UUID usuarioId = UUID.randomUUID();
        UsuarioMO usuario = new UsuarioMO();
        usuario.setRol(RolMO.JURADO);
        when(usuarioService.obtener(usuarioId)).thenReturn(usuario);

        UsuarioMO resultado = votoService.validarJurado(votacion, usuarioId);

        assertThat(resultado).isSameAs(usuario);
    }

    @Test
    void validarJurado_rolOrganizador_devuelveUsuario() {
        votacion.setTipo(TipoVotacionMO.JURADO);
        UUID usuarioId = UUID.randomUUID();
        UsuarioMO usuario = new UsuarioMO();
        usuario.setRol(RolMO.ORGANIZADOR);
        when(usuarioService.obtener(usuarioId)).thenReturn(usuario);

        UsuarioMO resultado = votoService.validarJurado(votacion, usuarioId);

        assertThat(resultado).isSameAs(usuario);
    }

    // ============ validarAutoVotacion ============

    @Test
    void validarAutoVotacion_eventoConAutoVotacion_noLanza() {
        evento.setAutoVotacion(true);

        assertThatCode(() -> votoService.validarAutoVotacion(votacion, vp, UUID.randomUUID()))
            .doesNotThrowAnyException();
    }

    @Test
    void validarAutoVotacion_usuarioIdNull_noLanza() {
        evento.setAutoVotacion(false);

        assertThatCode(() -> votoService.validarAutoVotacion(votacion, vp, null))
            .doesNotThrowAnyException();
    }

    @Test
    void validarAutoVotacion_usuarioNoEsCompetidor_noLanza() {
        evento.setAutoVotacion(false);
        UUID usuarioId = UUID.randomUUID();
        when(competidorService.findByUsuarioIdOpt(usuarioId)).thenReturn(Optional.empty());

        assertThatCode(() -> votoService.validarAutoVotacion(votacion, vp, usuarioId))
            .doesNotThrowAnyException();
    }

    @Test
    void validarAutoVotacion_proyectoSinEquipo_noLanza() {
        evento.setAutoVotacion(false);
        UUID usuarioId = UUID.randomUUID();
        CompetidorMO competidor = new CompetidorMO();
        competidor.setId(UUID.randomUUID());
        when(competidorService.findByUsuarioIdOpt(usuarioId)).thenReturn(Optional.of(competidor));
        when(equipoService.findByProyectoId(proyecto.getId())).thenReturn(null);

        assertThatCode(() -> votoService.validarAutoVotacion(votacion, vp, usuarioId))
            .doesNotThrowAnyException();
    }

    @Test
    void validarAutoVotacion_competidorNoEnElEquipo_noLanza() {
        evento.setAutoVotacion(false);
        UUID usuarioId = UUID.randomUUID();
        CompetidorMO competidor = new CompetidorMO();
        competidor.setId(UUID.randomUUID());
        EquipoMO equipo = new EquipoMO();
        equipo.setId(UUID.randomUUID());
        when(competidorService.findByUsuarioIdOpt(usuarioId)).thenReturn(Optional.of(competidor));
        when(equipoService.findByProyectoId(proyecto.getId())).thenReturn(equipo);
        when(competidorEventoService.esMiembroDeEquipo(competidor.getId(), equipo.getId()))
            .thenReturn(false);

        assertThatCode(() -> votoService.validarAutoVotacion(votacion, vp, usuarioId))
            .doesNotThrowAnyException();
    }

    @Test
    void validarAutoVotacion_competidorEsMiembroDelEquipo_lanza403() {
        evento.setAutoVotacion(false);
        UUID usuarioId = UUID.randomUUID();
        CompetidorMO competidor = new CompetidorMO();
        competidor.setId(UUID.randomUUID());
        EquipoMO equipo = new EquipoMO();
        equipo.setId(UUID.randomUUID());
        when(competidorService.findByUsuarioIdOpt(usuarioId)).thenReturn(Optional.of(competidor));
        when(equipoService.findByProyectoId(proyecto.getId())).thenReturn(equipo);
        when(competidorEventoService.esMiembroDeEquipo(competidor.getId(), equipo.getId()))
            .thenReturn(true);

        assertThatThrownBy(() -> votoService.validarAutoVotacion(votacion, vp, usuarioId))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("propio proyecto");
    }

    // ============ obtenerVotacionProyecto ============

    @Test
    void obtenerVotacionProyecto_delegaEnVotacionProyectoService() {
        UUID id = UUID.randomUUID();
        when(votacionProyectoService.obtener(id)).thenReturn(vp);

        VotacionProyectoMO resultado = votoService.obtenerVotacionProyecto(id);

        assertThat(resultado).isSameAs(vp);
    }

    // ============ haAlcanzadoMaximo ============

    @Test
    void haAlcanzadoMaximo_emitidosIgualMax_devuelveTrue() {
        when(votoRepository.countByVotacionProyecto_Votacion_IdAndAnonTokenHash(votacion.getId(), "tk"))
            .thenReturn(3L);

        assertThat(votoService.haAlcanzadoMaximo(vp, "tk")).isTrue();
    }

    @Test
    void haAlcanzadoMaximo_emitidosMenorQueMax_devuelveFalse() {
        when(votoRepository.countByVotacionProyecto_Votacion_IdAndAnonTokenHash(votacion.getId(), "tk"))
            .thenReturn(2L);

        assertThat(votoService.haAlcanzadoMaximo(vp, "tk")).isFalse();
    }

    // ============ Consultas básicas (delegación) ============

    @Test
    void yaHaVotado_tokenVacio_devuelveFalse() {
        assertThat(votoService.yaHaVotado(vp.getId(), "  ")).isFalse();
    }

    @Test
    void yaHaVotado_tokenValido_delegaEnRepo() {
        when(votoRepository.existsByVotacionProyecto_IdAndAnonTokenHash(vp.getId(), "tk"))
            .thenReturn(true);

        assertThat(votoService.yaHaVotado(vp.getId(), "tk")).isTrue();
    }

    @Test
    void contarVotosPorVotacionProyecto_delegaEnRepo() {
        when(votoRepository.countByVotacionProyecto_Id(vp.getId())).thenReturn(5L);

        assertThat(votoService.contarVotosPorVotacionProyecto(vp.getId())).isEqualTo(5L);
    }

    @Test
    void contarVotantesUnicos_delegaEnRepo() {
        UUID eventoId = UUID.randomUUID();
        when(votoRepository.countDistinctVotantesByEventoId(eventoId)).thenReturn(42L);

        assertThat(votoService.contarVotantesUnicos(eventoId)).isEqualTo(42L);
    }
}