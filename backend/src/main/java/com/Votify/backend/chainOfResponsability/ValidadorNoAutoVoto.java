package com.Votify.backend.chainOfResponsability;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.dto.VotoRequest;
import com.Votify.backend.model.EquipoMO;
import com.Votify.backend.model.UsuarioMO;
import com.Votify.backend.model.VotacionProyectoMO;
import com.Votify.backend.repository.EquipoRepository;
import com.Votify.backend.repository.UsuarioRepository;
import com.Votify.backend.repository.VotacionProyectoRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ValidadorNoAutoVoto extends ValidadorVotoBase {
    
    private final UsuarioRepository usuarioRepository;
    private final VotacionProyectoRepository votacionProyectoRepository;
    private final EquipoRepository equipoRepository;
    
    @Override
    protected void ejecutarValidacion(VotoRequest request) {
        UsuarioMO usuario = usuarioRepository.findById(request.usuarioId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Usuario no encontrado"));
        
        VotacionProyectoMO vp = votacionProyectoRepository.findById(request.votacionProyectoId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "VotacionProyecto no encontrado"));
        
        EquipoMO equipo = equipoRepository.findByProyecto_Id(vp.getProyecto().getId());
        
        if (equipo != null && equipo.getCompetidores() != null && equipo.getCompetidores().contains(usuario)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                "No puedes votar a tu propio proyecto");
        }
    }
}
