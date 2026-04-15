package com.Votify.backend.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.model.RolMO;
import com.Votify.backend.model.UsuarioMO;
import com.Votify.backend.service.GenericService;
import com.Votify.backend.service.UsuarioService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController extends GenericController<UsuarioMO>{


    private final UsuarioService usuarioService;

    @Override
    protected GenericService<UsuarioMO> getService(){

        return usuarioService;

    }

    private void validarOrganizador(String rolHeader){
        if (rolHeader == null || !rolHeader.equals(RolMO.ORGANIZADOR.name())) {
            throw new RuntimeException("No autorizado: solo un organizador puede gestionar usuarios.");
        }
    }


    @PostMapping
    public UsuarioMO create(@RequestBody UsuarioMO usuario, @RequestHeader(value = "X-User-Role", required = false) String rolHeader){
        
        validarOrganizador(rolHeader);
        return usuarioService.save(usuario);

    }

    @PutMapping("/{id}")
    public UsuarioMO update(@PathVariable UUID id, @RequestBody UsuarioMO usuario, @RequestHeader(value = "X-User-Role", required = false) String rolHeader) {
       
        validarOrganizador(rolHeader);
        return usuarioService.update(id, usuario);
    }

    @GetMapping("/hasProyecto/{usuarioId}")
    public boolean hasProyecto(@PathVariable UUID usuarioId) {
        return usuarioService.hasProyecto(usuarioId);
    }
    

}



