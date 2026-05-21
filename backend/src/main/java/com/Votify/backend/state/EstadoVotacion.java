package com.Votify.backend.state;

import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.VotacionMO;

public interface EstadoVotacion {
    
    EstadoVotacionMO tipo();
    void abrir(VotacionMO votacion);
    void pausar(VotacionMO votacion);
    void reanudar(VotacionMO votacion);
    void cerrar(VotacionMO votacion);
    void publicarResultados(VotacionMO votacion);
    void emitirVoto(VotacionMO votacion);
    boolean verificarExpiracion(VotacionMO votacion);

}
