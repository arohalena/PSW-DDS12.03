package com.Votify.backend.chainOfResponsability;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class ValidacionVotoConfig {
    
    private final ValidadorUsuarioExiste validadorUsuarioExiste;
    private final ValidadorVotacionAbierta validadorVotacionAbierta;
    private final ValidadorVotacionProyectoExiste validadorVotacionProyectoExiste;
    private final ValidadorJurado validadorJurado;
    private final ValidadorMaximoYDuplicado validadorMaximoYDuplicado;
    private final ValidadorNoAutoVoto validadorNoAutoVoto;
    private final ValidadorComentarioObligatorio validadorComentarioObligatorio;
    
    @Bean
    @Primary
    public ValidadorVoto cadenaValidadorVoto() {
        validadorUsuarioExiste.setSiguiente(validadorVotacionAbierta);
        validadorVotacionAbierta.setSiguiente(validadorVotacionProyectoExiste);
        validadorVotacionProyectoExiste.setSiguiente(validadorJurado);
        validadorJurado.setSiguiente(validadorMaximoYDuplicado);
        validadorMaximoYDuplicado.setSiguiente(validadorNoAutoVoto);
        validadorNoAutoVoto.setSiguiente(validadorComentarioObligatorio);
        
        return validadorUsuarioExiste;
    }
}
