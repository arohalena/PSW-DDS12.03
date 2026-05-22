package com.Votify.backend.state;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.EstadoVotacionMO;
import com.Votify.backend.model.VotacionMO;

abstract class EstadoVotacionBase implements EstadoVotacion {

    protected void cambiarEstado(VotacionMO votacion, EstadoVotacionMO nuevoEstado) {
        votacion.cambiarEstado(nuevoEstado);
    }
    
    protected void transicionNoPermitida(String mensaje) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, mensaje);
    }

    protected void votoNoPermitido(String mensaje) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, mensaje);
    }

    @Override
    public void abrir(VotacionMO votacion) {
        transicionNoPermitida("No se puede abrir una votación en estado " + tipo() + ".");
    }

    @Override
    public void pausar(VotacionMO votacion) {
        transicionNoPermitida("No se puede pausar una votación en estado " + tipo() + ".");
    }

    @Override
    public void reanudar(VotacionMO votacion) {
        transicionNoPermitida("No se puede reanudar una votación en estado " + tipo() + ".");
    }

     @Override
    public void cerrar(VotacionMO votacion) {
        transicionNoPermitida("No se puede cerrar una votacion en estado " + tipo() + ".");
    }

    @Override
    public void publicarResultados(VotacionMO votacion) {
        transicionNoPermitida("Solo se pueden publicar resultados de una votación cerrada.");
    }

    @Override
    public void emitirVoto(VotacionMO votacion) {
        votoNoPermitido("No se puede votar en estado " + tipo() + ".");
    }

    @Override
    public boolean verificarExpiracion(VotacionMO votacion) {
        return false;
    }
}

