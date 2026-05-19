package com.Votify.backend.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.CompetidorMO;
import com.Votify.backend.model.UsuarioMO;
import com.Votify.backend.repository.CompetidorEventoRepository;
import com.Votify.backend.repository.CompetidorRepository;
import com.Votify.backend.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class CompetidorService extends GenericService<CompetidorMO> {

    private final CompetidorRepository competidorRepository;
    private final UsuarioRepository usuarioRepository;
    private final CompetidorEventoRepository competidorEventoRepository;

    @Override
    protected JpaRepository<CompetidorMO, UUID> getRepository() {
        return competidorRepository;
    }

    public CompetidorMO crear (CompetidorMO competidor){
        vincularUsuarioObligatorio(competidor);
        return competidorRepository.save(competidor);
    }
    
    public CompetidorMO actualizar (UUID id, CompetidorMO competidorActualizado){
        CompetidorMO competidorEx = competidorRepository.findById(id).orElseThrow(() -> new RuntimeException("Competidor no encontrado"));
        competidorEx.setNombre(competidorActualizado.getNombre());
        competidorEx.setEmail(competidorActualizado.getEmail());

        vincularUsuarioObligatorio(competidorEx);
        return competidorRepository.save(competidorEx);
    }

    @Transactional
    public int vincularCompetidoresConUsuariosPorEmail(){
        List<CompetidorMO> competidores = competidorRepository.findAll();
        int actualizados = 0;
        for (CompetidorMO competidor : competidores){
            if (competidor.getUsuario() != null) continue; 
            if (competidor.getEmail() == null || competidor.getEmail().isBlank()) continue;
            usuarioRepository.findByEmailIgnoreCase(competidor.getEmail().trim()).ifPresent(usuario -> {
                competidor.setUsuario(usuario);
                competidor.setPassword(usuario.getPassword());
                competidorRepository.save(competidor);
            });
            if (competidor.getUsuario() != null) actualizados++;
        }
        return actualizados;
    }

    private void vincularUsuarioObligatorio(CompetidorMO competidor){
        if(competidor.getUsuario() != null) return;
        if(competidor.getEmail() == null || competidor.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El email del competidor es obligatorio.");
        }
        UsuarioMO usuario = usuarioRepository.findByEmailIgnoreCase(competidor.getEmail().trim()).orElse(null);
        if(usuario == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No existe un usuario registrado con ese email. Debes crear primero el usuario.");
        }

        competidor.setUsuario(usuario);
        competidor.setPassword(usuario.getPassword());
    }

    public CompetidorMO getByUsuarioId(UUID usuarioId) { 
        try {
            return competidorRepository.findByUsuarioId(usuarioId).get();
        } catch (Exception e ) {
            throw new RuntimeException("Error al obtener competidor mediante usuario id: " + e.getMessage());
        }
    }

    public CompetidorMO obtenerPorUsuarioId(UUID usuarioId) {

        return competidorRepository.findByUsuarioId(usuarioId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "No se ha encontrado un competidor asociado a este usuario."
            ));

    }

    public Optional<CompetidorMO> findByUsuarioIdOpt(UUID usuarioId) {

        return competidorRepository.findByUsuarioId(usuarioId);
        
    }

    @Override
    @Transactional
    public void delete(UUID id){
        CompetidorMO competidor = competidorRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Competidor no encontrado."));

        competidorEventoRepository.deleteAll(
            competidorEventoRepository.findByCompetidorId(id)
        );
 
        competidorRepository.delete(competidor);
    }
}


