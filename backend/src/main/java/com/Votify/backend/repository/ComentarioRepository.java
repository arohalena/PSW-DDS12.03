package com.Votify.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.Votify.backend.model.Comentario;

public interface ComentarioRepository extends JpaRepository<Comentario, UUID>{

    List<Comentario> findByVotacionProyecto_Id(UUID votacionProyectoId);
    
}
