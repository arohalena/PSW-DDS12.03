package com.Votify.backend.chainOfResponsability;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.dto.VotoRequest;
import com.Votify.backend.model.RolMO;
import com.Votify.backend.model.TipoVotacionMO;
import com.Votify.backend.model.UsuarioMO;
import com.Votify.backend.model.VotacionMO;
import com.Votify.backend.repository.VotacionRepository;
import com.Votify.backend.service.UsuarioService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ValidadorJurado extends ValidadorVotoBase {

    private final VotacionRepository votacionRepository;
    private final UsuarioService usuarioService;

    @Override
    protected void ejecutarValidacion(VotoRequest request) {
        VotacionMO votacion = votacionRepository.findById(request.votacionId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Votación no encontrada"));

        if (votacion.getTipo() != TipoVotacionMO.JURADO) return;

        if (request.usuarioId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Esta votación es de jurado; se necesita usuarioId.");
        }

        UsuarioMO usuario = usuarioService.obtener(request.usuarioId());
        if (usuario == null || (usuario.getRol() != RolMO.JURADO)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Debes ser jurado para votar en esta votación.");
        }
    }
}
