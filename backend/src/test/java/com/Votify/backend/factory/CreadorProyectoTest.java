package com.Votify.backend.factory;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

import com.Votify.backend.domain.Proyecto;
import com.Votify.backend.domain.ProyectoIA;
import com.Votify.backend.domain.ProyectoSostenibilidad;
import com.Votify.backend.model.TipoCategoriaMO;

class CreadorProyectoTest {

    @Test
    void creadorProyectoIA_devuelveProyectoIAConCategoriaCorrecta() {
        CreadorProyecto creador = new CreadorProyectoIA();

        Proyecto proyecto = creador.create("Asistente IA", "Chatbot universitario");

        assertThat(proyecto).isInstanceOf(ProyectoIA.class);
        assertThat(proyecto.categoria()).isEqualTo(TipoCategoriaMO.IA);
        assertThat(proyecto.getNombre()).isEqualTo("Asistente IA");
        assertThat(proyecto.getDescripcion()).isEqualTo("Chatbot universitario");
    }

    @Test
    void creadorProyectoSostenibilidad_devuelveProyectoSostenibilidadConCategoriaCorrecta() {
        CreadorProyecto creador = new CreadorProyectoSostenibilidad();

        Proyecto proyecto = creador.create("EcoTracker", "App para reducir huella de carbono");

        assertThat(proyecto).isInstanceOf(ProyectoSostenibilidad.class);
        assertThat(proyecto.categoria()).isEqualTo(TipoCategoriaMO.SOSTENIBILIDAD);
        assertThat(proyecto.getNombre()).isEqualTo("EcoTracker");
    }

    @Test
    void cadaCreador_devuelveSubclaseDistintaDeProyecto() {
        Proyecto pIA = new CreadorProyectoIA().create("a", "b");
        Proyecto pSos = new CreadorProyectoSostenibilidad().create("a", "b");

        assertThat(pIA.getClass()).isNotEqualTo(pSos.getClass());
        assertThat(pIA.categoria()).isNotEqualTo(pSos.categoria());
    }

    @Test
    void proyectoIA_camposPersistenSinModificar() {
        Proyecto p = new CreadorProyectoIA().create("Nombre", "Descripción larga");

        assertThat(p.getNombre()).isEqualTo("Nombre");
        assertThat(p.getDescripcion()).isEqualTo("Descripción larga");
        assertThat(p.categoria()).isEqualTo(TipoCategoriaMO.IA);
    }

    @Test
    void creadores_aceptanNombresVacios() {
        // El creador NO valida nada — eso es del Facade. Si valida, hay un bug.
        Proyecto p = new CreadorProyectoSostenibilidad().create("", "");

        assertThat(p.getNombre()).isEmpty();
        assertThat(p.categoria()).isEqualTo(TipoCategoriaMO.SOSTENIBILIDAD);
    }
}