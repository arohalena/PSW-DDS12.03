package com.Votify.backend.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Votify.backend.model.Rol;
import com.Votify.backend.model.Usuario;
import com.Votify.backend.service.GenericService;
import com.Votify.backend.service.UsuarioService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController extends GenericController<Usuario>{


    private final UsuarioService usuarioService;

    @Override
    protected GenericService<Usuario> getService(){

        return usuarioService;

    }

    private void validarOrganizador(String rolHeader){
        if (rolHeader == null || !rolHeader.equals(Rol.ORGANIZADOR.name())) {
            throw new RuntimeException("No autorizado: solo un organizador puede gestionar usuarios.");
        }
    }


    @PostMapping
    public Usuario create(@RequestBody Usuario usuario, @RequestHeader(value = "X-User-Role", required = false) String rolHeader){
        
        validarOrganizador(rolHeader);
        return usuarioService.save(usuario);

    }

     @PutMapping("/{id}")
    public Usuario update(@PathVariable UUID id, @RequestBody Usuario usuario, @RequestHeader(value = "X-User-Role", required = false) String rolHeader) {
       
        validarOrganizador(rolHeader);
        return usuarioService.update(id, usuario);
    }
    

}



