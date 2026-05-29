package com.Votify.backend.chainOfResponsability;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.dto.VotoRequest;

class ValidacionVotoChainTest {

    private static final VotoRequest REQUEST = new VotoRequest(
        java.util.UUID.randomUUID(),
        java.util.UUID.randomUUID(),
        java.util.UUID.randomUUID(),
        "token-1",
        "comentario"
    );

    private static class ValidadorStub extends ValidadorVotoBase {
        int invocaciones;
        boolean lanzar;
        ResponseStatusException ex;

        @Override
        protected void ejecutarValidacion(VotoRequest request) {
            invocaciones++;
            if (lanzar) {
                throw ex != null ? ex : new ResponseStatusException(HttpStatus.BAD_REQUEST, "fallo");
            }
        }
    }

    @Test
    void validar_ejecutaCadenaCompleta() {
        ValidadorStub primero = new ValidadorStub();
        ValidadorStub segundo = new ValidadorStub();
        ValidadorStub tercero = new ValidadorStub();

        primero.setSiguiente(segundo);
        segundo.setSiguiente(tercero);

        primero.validar(REQUEST);

        assertThat(primero.invocaciones).isEqualTo(1);
        assertThat(segundo.invocaciones).isEqualTo(1);
        assertThat(tercero.invocaciones).isEqualTo(1);
    }

    @Test
    void validar_cortaLaCadenaSiUnValidadorFalla() {
        ValidadorStub primero = new ValidadorStub();
        ValidadorStub segundo = new ValidadorStub();
        ValidadorStub tercero = new ValidadorStub();

        segundo.lanzar = true;
        segundo.ex = new ResponseStatusException(HttpStatus.CONFLICT, "bloqueado");

        primero.setSiguiente(segundo);
        segundo.setSiguiente(tercero);

        assertThatThrownBy(() -> primero.validar(REQUEST))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("bloqueado");

        assertThat(primero.invocaciones).isEqualTo(1);
        assertThat(segundo.invocaciones).isEqualTo(1);
        assertThat(tercero.invocaciones).isEqualTo(0);
    }

    @Test
    void siguiente_devuelveElSiguienteValidador() {
        ValidadorStub primero = new ValidadorStub();
        ValidadorStub segundo = new ValidadorStub();

        primero.setSiguiente(segundo);

        assertThat(primero.siguiente()).isSameAs(segundo);
    }
}
