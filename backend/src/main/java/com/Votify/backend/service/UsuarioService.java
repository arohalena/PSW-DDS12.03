package com.Votify.backend.service;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import com.Votify.backend.model.Usuario;
import com.Votify.backend.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class UsuarioService  extends GenericService<Usuario>{
    private final UsuarioRepository usuarioRepository;

    @Override
    protected JpaRepository<Usuario, UUID> getRepository(){

        return usuarioRepository;

    }
}

   
