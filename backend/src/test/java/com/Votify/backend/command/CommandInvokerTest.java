package com.Votify.backend.command;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class CommandInvokerTest {

    @Test
    void execute_ejecutaComandoSinConocerLaOperacionConcreta() {
        CommandInvoker invoker = new CommandInvoker();
        VotifyCommand<String> command = () -> "ejecutado";

        String resultado = invoker.execute(command);

        assertThat(resultado).isEqualTo("ejecutado");
    }
}
