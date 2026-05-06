package com.Votify.backend.service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.domain.Proyecto;
import com.Votify.backend.dto.ProyectoGestionRequest;
import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.EventoMO;
import com.Votify.backend.model.ProyectoMO;
import com.Votify.backend.model.TipoCategoriaMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.model.VotoMO;
import com.Votify.backend.repository.ComentarioRepository;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.ProyectoRepository;
import com.Votify.backend.repository.PuntuacionCriterioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;
import com.Votify.backend.repository.VotoCriterioRepository;
import com.Votify.backend.repository.VotoRepository;

@ExtendWith(MockitoExtension.class)
class ProyectoServiceTest {

    @Mock private ProyectoRepository proyectoRepository;
    @Mock private VotacionProyectoRepository votacionProyectoRepository;
    @Mock private VotoRepository votoRepository;
    @Mock private VotoCriterioRepository votoCriterioRepository;
    @Mock private ComentarioRepository comentarioRepository;
    @Mock private PuntuacionCriterioRepository puntuacionCriterioRepository;
    @Mock private EquipoRepository equipoRepository;

    @InjectMocks private ProyectoService proyectoService;

    // ------------------------- validarTipoCategoria -------------------------

    @Test
    void validarTipoCategoria_null_lanza400() {
        assertThatThrownBy(() -> proyectoService.validarTipoCategoria(null))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("tipo de proyecto");
    }

    @Test
    void validarTipoCategoria_valido_noLanza() {
        assertThatCode(() -> proyectoService.validarTipoCategoria(TipoCategoriaMO.IA))
            .doesNotThrowAnyException();
    }

    // ------------------------- validarCategoriaTexto -------------------------

    @Test
    void validarCategoriaTexto_null_lanza400() {
        assertThatThrownBy(() -> proyectoService.validarCategoriaTexto(null))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("categor");
    }

    @Test
    void validarCategoriaTexto_blanco_lanza400() {
        assertThatThrownBy(() -> proyectoService.validarCategoriaTexto("  "))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("categor");
    }

    @Test
    void validarCategoriaTexto_valido_noLanza() {
        assertThatCode(() -> proyectoService.validarCategoriaTexto("IA"))
            .doesNotThrowAnyException();
    }

    // ------------------------- validarDatosGestion -------------------------

    @Test
    void validarDatosGestion_nombreVacio_lanza400() {
        ProyectoGestionRequest request = new ProyectoGestionRequest(
            "  ", "desc", "IA", UUID.randomUUID(), UUID.randomUUID(), Collections.emptyList()
        );

        assertThatThrownBy(() -> proyectoService.validarDatosGestion(request))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("nombre");
    }

    @Test
    void validarDatosGestion_categoriaVacia_lanza400() {
        ProyectoGestionRequest request = new ProyectoGestionRequest(
            "Nombre", "desc", "  ", UUID.randomUUID(), UUID.randomUUID(), Collections.emptyList()
        );

        assertThatThrownBy(() -> proyectoService.validarDatosGestion(request))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("categor");
    }

    @Test
    void validarDatosGestion_equipoIdNull_lanza400() {
        ProyectoGestionRequest request = new ProyectoGestionRequest(
            "Nombre", "desc", "IA", null, UUID.randomUUID(), Collections.emptyList()
        );

        assertThatThrownBy(() -> proyectoService.validarDatosGestion(request))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("equipo");
    }

    @Test
    void validarDatosGestion_valido_noLanza() {
        ProyectoGestionRequest request = new ProyectoGestionRequest(
            "Nombre", "desc", "IA", UUID.randomUUID(), UUID.randomUUID(), Collections.emptyList()
        );

        assertThatCode(() -> proyectoService.validarDatosGestion(request))
            .doesNotThrowAnyException();
    }

    // ------------------------- equipoOcupadoEnEvento -------------------------

    @Test
    void equipoOcupadoEnEvento_eventoIdNull_devuelveFalse() {
        boolean ocupado = proyectoService.equipoOcupadoEnEvento(UUID.randomUUID(), null, null);
        assertThat(ocupado).isFalse();
    }

    @Test
    void equipoOcupadoEnEvento_sinProyectoActual_consultaSimple() {
        UUID equipoId = UUID.randomUUID();
        UUID eventoId = UUID.randomUUID();
        when(proyectoRepository.existsByEvento_IdAndEquipo_Id(eventoId, equipoId)).thenReturn(true);

        assertThat(proyectoService.equipoOcupadoEnEvento(equipoId, eventoId, null)).isTrue();
    }

    @Test
    void equipoOcupadoEnEvento_conProyectoActual_consultaExcluyente() {
        UUID equipoId = UUID.randomUUID();
        UUID eventoId = UUID.randomUUID();
        UUID proyectoActualId = UUID.randomUUID();
        when(proyectoRepository.existsByEvento_IdAndEquipo_IdAndIdNot(eventoId, equipoId, proyectoActualId))
            .thenReturn(false);

        assertThat(proyectoService.equipoOcupadoEnEvento(equipoId, eventoId, proyectoActualId)).isFalse();
    }

    // ------------------------- validarEquipoDisponibleEnEvento -------------------------

    @Test
    void validarEquipoDisponibleEnEvento_ocupado_lanza409() {
        UUID equipoId = UUID.randomUUID();
        UUID eventoId = UUID.randomUUID();
        when(proyectoRepository.existsByEvento_IdAndEquipo_Id(eventoId, equipoId)).thenReturn(true);

        assertThatThrownBy(() -> proyectoService.validarEquipoDisponibleEnEvento(equipoId, eventoId, null))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("equipo");
    }

    @Test
    void validarEquipoDisponibleEnEvento_libre_noLanza() {
        UUID equipoId = UUID.randomUUID();
        UUID eventoId = UUID.randomUUID();
        when(proyectoRepository.existsByEvento_IdAndEquipo_Id(eventoId, equipoId)).thenReturn(false);

        assertThatCode(() -> proyectoService.validarEquipoDisponibleEnEvento(equipoId, eventoId, null))
            .doesNotThrowAnyException();
    }

    @Test
    void validarEquipoDisponibleEnEvento_eventoIdNull_noLanza() {
        assertThatCode(() -> proyectoService.validarEquipoDisponibleEnEvento(UUID.randomUUID(), null, null))
            .doesNotThrowAnyException();
    }

    // ------------------------- obtener -------------------------

    @Test
    void obtener_inexistente_lanza404() {
        UUID id = UUID.randomUUID();
        when(proyectoRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> proyectoService.obtener(id))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Proyecto");
    }

    @Test
    void obtener_existente_devuelveProyecto() {
        UUID id = UUID.randomUUID();
        ProyectoMO proyecto = new ProyectoMO();
        proyecto.setId(id);
        when(proyectoRepository.findById(id)).thenReturn(Optional.of(proyecto));

        ProyectoMO resultado = proyectoService.obtener(id);

        assertThat(resultado).isSameAs(proyecto);
    }

    // ------------------------- crearDesdeDominio -------------------------

    @Test
    void crearDesdeDominio_mapeaCamposYPersiste() {
        EventoMO evento = new EventoMO();
        evento.setId(UUID.randomUUID());

        Proyecto dominio = new com.Votify.backend.domain.ProyectoIA("EcoIA", "Proyecto IA");

        when(proyectoRepository.save(any(ProyectoMO.class))).thenAnswer(inv -> inv.getArgument(0));

        ProyectoMO resultado = proyectoService.crearDesdeDominio(dominio, evento);

        assertThat(resultado.getNombre()).isEqualTo("EcoIA");
        assertThat(resultado.getDescripcion()).isEqualTo("Proyecto IA");
        assertThat(resultado.getTipoCategoria()).isEqualTo(TipoCategoriaMO.IA);
        assertThat(resultado.getEvento()).isSameAs(evento);
    }

    // ------------------------- desvincularDeEvento -------------------------

    @Test
    void desvincularDeEvento_dejaProyectosSinEvento() {
        UUID eventoId = UUID.randomUUID();
        ProyectoMO p1 = new ProyectoMO();
        ProyectoMO p2 = new ProyectoMO();
        EventoMO evento = new EventoMO();
        evento.setId(eventoId);
        p1.setEvento(evento);
        p2.setEvento(evento);

        when(proyectoRepository.findByEvento_Id(eventoId)).thenReturn(List.of(p1, p2));

        proyectoService.desvincularDeEvento(eventoId);

        assertThat(p1.getEvento()).isNull();
        assertThat(p2.getEvento()).isNull();
        verify(proyectoRepository, times(2)).save(any(ProyectoMO.class));
    }

    // ------------------------- eliminarConCascada -------------------------

    @Test
    void eliminarConCascada_inexistente_lanza404() {
        UUID id = UUID.randomUUID();
        when(proyectoRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> proyectoService.eliminarConCascada(id))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Proyecto");

        verify(proyectoRepository, never()).deleteById(any());
    }

    @Test
    void eliminarConCascada_borraDependenciasYDesvinculaEquipo() {
        UUID proyectoId = UUID.randomUUID();
        ProyectoMO proyecto = new ProyectoMO();
        proyecto.setId(proyectoId);

        VotacionProyectoMO vp = new VotacionProyectoMO();
        vp.setId(UUID.randomUUID());

        VotoMO voto = new VotoMO();
        voto.setId(UUID.randomUUID());

        EquipoMO equipo = new EquipoMO();
        equipo.setId(UUID.randomUUID());
        equipo.setProyecto(proyecto);

        when(proyectoRepository.findById(proyectoId)).thenReturn(Optional.of(proyecto));
        when(votacionProyectoRepository.findByProyecto_Id(proyectoId)).thenReturn(List.of(vp));
        when(comentarioRepository.findByVotacionProyecto_Id(vp.getId())).thenReturn(Collections.emptyList());
        when(puntuacionCriterioRepository.findByVotacionProyecto_Id(vp.getId())).thenReturn(Collections.emptyList());
        when(votoRepository.findByVotacionProyecto_Id(vp.getId())).thenReturn(List.of(voto));
        when(votoCriterioRepository.findByVoto_Id(voto.getId())).thenReturn(Collections.emptyList());
        when(comentarioRepository.findByProyecto_Id(proyectoId)).thenReturn(Collections.emptyList());
        when(equipoRepository.findByProyecto_Id(proyectoId)).thenReturn(equipo);

        proyectoService.eliminarConCascada(proyectoId);

        verify(votoRepository).delete(voto);
        verify(votacionProyectoRepository).delete(vp);
        verify(comentarioRepository, times(2)).deleteAll(anyIterable()); // por vp + por proyecto
        verify(puntuacionCriterioRepository).deleteAll(anyIterable());
        verify(votoCriterioRepository).deleteAll(anyIterable());
        verify(equipoRepository).save(equipo);
        assertThat(equipo.getProyecto()).isNull();
        assertThat(proyecto.getEvento()).isNull();
        assertThat(proyecto.getEquipo()).isNull();
        verify(proyectoRepository).deleteById(proyectoId);
    }

    @Test
    void eliminarConCascada_sinEquipoVinculado_borraProyectoIgualmente() {
        UUID proyectoId = UUID.randomUUID();
        ProyectoMO proyecto = new ProyectoMO();
        proyecto.setId(proyectoId);

        when(proyectoRepository.findById(proyectoId)).thenReturn(Optional.of(proyecto));
        when(votacionProyectoRepository.findByProyecto_Id(proyectoId)).thenReturn(Collections.emptyList());
        when(comentarioRepository.findByProyecto_Id(proyectoId)).thenReturn(Collections.emptyList());
        when(equipoRepository.findByProyecto_Id(proyectoId)).thenReturn(null);

        proyectoService.eliminarConCascada(proyectoId);

        verify(equipoRepository, never()).save(any(EquipoMO.class));
        verify(proyectoRepository).deleteById(proyectoId);
    }

    // ------------------------- findByEvento_Id / findByEquipo_Id -------------------------

    @Test
    void findByEvento_Id_delegaEnRepo() {
        UUID eventoId = UUID.randomUUID();
        when(proyectoRepository.findByEvento_Id(eventoId)).thenReturn(Collections.emptyList());

        proyectoService.findByEvento_Id(eventoId);

        verify(proyectoRepository).findByEvento_Id(eq(eventoId));
    }

    @Test
    void findByEquipo_Id_delegaEnRepo() {
        UUID equipoId = UUID.randomUUID();
        when(proyectoRepository.findByEquipo_Id(equipoId)).thenReturn(Collections.emptyList());

        proyectoService.findByEquipo_Id(equipoId);

        verify(proyectoRepository).findByEquipo_Id(eq(equipoId));
    }
}