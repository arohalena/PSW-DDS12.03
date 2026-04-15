package com.Votify.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.Votify.backend.model.CompetidorMO;
import com.Votify.backend.repository.CompetidorRepository;
import com.Votify.backend.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class CompetidorService extends GenericService<CompetidorMO> {

    private final CompetidorRepository competidorRepository;
    private final UsuarioRepository usuarioRepository;

    @Override
    protected JpaRepository<CompetidorMO, UUID> getRepository() {
        return competidorRepository;
    }

    public CompetidorMO crear (CompetidorMO competidor){
        vincularUsuarioSiExiste(competidor);
        return competidorRepository.save(competidor);
    }
    
    public CompetidorMO actualizar (UUID id, CompetidorMO competidorActualizado){
        CompetidorMO competidorEx = competidorRepository.findById(id).orElseThrow(() -> new RuntimeException("Competidor no encontrado"));
        competidorEx.setNombre(competidorActualizado.getNombre());
        competidorEx.setEmail(competidorActualizado.getEmail());
        competidorEx.setPassword(competidorActualizado.getPassword());
        vincularUsuarioSiExiste(competidorEx);
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
                competidorRepository.save(competidor);
            });
            if (competidor.getUsuario() != null) actualizados++;
        }
        return actualizados;
    }

    private void vincularUsuarioSiExiste(CompetidorMO competidor){
        if(competidor.getUsuario() != null) return;
        if(competidor.getEmail() == null || competidor.getEmail().isBlank()) return;
        usuarioRepository.findByEmailIgnoreCase(competidor.getEmail().trim()).ifPresent(competidor::setUsuario);
    }
}


