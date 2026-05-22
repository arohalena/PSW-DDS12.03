package com.Votify.backend.state;

import java.time.OffsetDateTime;

import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.VotacionMO;


public class EstadoCerrada extends EstadoVotacionBase {
    @Override
    public EstadoVotacionMO tipo() {
        return EstadoVotacionMO.CERRADA;
    }

    @Override
    public void cerrar(VotacionMO votacion) {
        // Cerrar una votación cerrada conserva el estado.
    }

    @Override
    public void publicarResultados(VotacionMO votacion) {
        votacion.setResultadosPublicados(true);
        votacion.setFechaPublicacionResultados(OffsetDateTime.now());
    }

    @Override
    public void emitirVoto(VotacionMO votacion) {
        votoNoPermitido("La votación ya ha finalizado.");
    }
}
