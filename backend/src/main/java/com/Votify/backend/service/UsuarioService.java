package com.Votify.backend.service;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.Votify.backend.model.RolMO;
import com.Votify.backend.model.UsuarioMO;
import com.Votify.backend.repository.CompetidorEventoRepository;
import com.Votify.backend.repository.CompetidorRepository;
import com.Votify.backend.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class UsuarioService  extends GenericService<UsuarioMO>{

    private final UsuarioRepository usuarioRepository;
    private final CompetidorRepository competidorRepository;
    private final CompetidorEventoRepository competidorEventoRepository;

    @Override
    protected JpaRepository<UsuarioMO, UUID> getRepository(){

        return usuarioRepository;

    }

    public UsuarioMO update(UUID id, UsuarioMO usuarioActualizado) {
        UsuarioMO existente = findById(id);

        existente.setNombre(usuarioActualizado.getNombre());
        existente.setEmail(usuarioActualizado.getEmail());
        existente.setRol(usuarioActualizado.getRol());

        return usuarioRepository.save(existente);
    }
    
    public void crearAdminSiNoExiste(String nombre, String email, String password) {

        if(!usuarioRepository.existsByRol(RolMO.ORGANIZADOR)){

            UsuarioMO admin = new UsuarioMO();
            admin.setNombre(nombre);
            admin.setEmail(email);
            admin.setPassword(password);
            admin.setRol(RolMO.ORGANIZADOR);
            
            usuarioRepository.save(admin);
            
        }
    }

    public boolean hasProyecto(UUID usuarioId) {

        return competidorRepository.findByUsuarioId(usuarioId)
                .map(c -> !competidorEventoRepository.findByCompetidorId(c.getId()).isEmpty())
                .orElse(false);

    }
    public UsuarioMO obtener(UUID id) {

        return usuarioRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario no encontrado."));
            
    }
}

   
